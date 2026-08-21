const http = require("http");

const BASE_URL =
  "http://localhost:5050";


async function request(
  method,
  path,
  body
) {

  return new Promise(
    (resolve, reject) => {

      const payload =
        body
          ? JSON.stringify(body)
          : null;

      const req =
        http.request(
          `${BASE_URL}${path}`,
          {
            method,

            headers: {
              "Content-Type":
                "application/json"
            }
          },

          response => {

            let data = "";

            response.on(
              "data",
              chunk => {
                data += chunk;
              }
            );

            response.on(
              "end",
              () => {

                resolve({
                  status:
                    response.statusCode,

                  body:
                    data
                      ? JSON.parse(data)
                      : null
                });

              }
            );

          }
        );

      req.on(
        "error",
        reject
      );

      if (payload) {
        req.write(payload);
      }

      req.end();

    }
  );

}
async function run() {

  console.log(
    "\nPATHFORGE CONCURRENCY TEST\n"
  );

  const email =
    `race-${Date.now()}@test.local`;

  const userResponse =
    await request(
      "POST",
      "/api/users",
      {
        name:
          "Concurrency Tester",

        email
      }
    );

  const userId =
    userResponse.body.user_id;


  /*
  ----------------------------------------------------------
  STEP 1
  ----------------------------------------------------------
  */

  const firstBatch =
    await Promise.all(
      Array.from(
        { length: 100 },
        () =>
          request(
            "POST",
            `/api/users/${userId}/certifications/azure-fundamentals/complete`
          )
      )
    );

  const successCount =
    firstBatch.filter(
      response =>
        response.status === 201
    ).length;

  const rejectedCount =
    firstBatch.filter(
      response =>
        response.status !== 201
    ).length;

  console.log(
    "Concurrent completion requests : 100"
  );

  console.log(
    "Successful completions          :",
    successCount
  );

  console.log(
    "Rejected requests               :",
    rejectedCount
  );

  if (successCount !== 1) {

    throw new Error(
      `FAIL: expected exactly 1 success, got ${successCount}`
    );

  }

  console.log(
    "PASS: duplicate completion prevented."
  );


  /*
  ----------------------------------------------------------
  STEP 2
  ----------------------------------------------------------
  */

  const progress =
    await request(
      "GET",
      `/api/users/${userId}/progress/cloud`
    );

  const completed =
    progress.body.certifications.filter(
      item =>
        item.status === "completed"
    );

  console.log(
    "Completed certifications in DB :",
    completed.length
  );

  if (completed.length !== 1) {

    throw new Error(
      "FAIL: database contains an incorrect number of completions."
    );

  }

  console.log(
    "PASS: database state is consistent."
  );

  console.log(
    "\nCONCURRENCY TEST PASSED.\n"
  );

}


run()
  .catch(error => {

    console.error(
      "\nCONCURRENCY TEST FAILED\n"
    );

    console.error(error);

    process.exit(1);

  });



          

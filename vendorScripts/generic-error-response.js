// Load compatibility script
load("nashorn:mozilla_compat.js");
load(classLoader.getResource("init.js"));

importPackage(java.lang);
importPackage(java.util);
importPackage(java.text);



(
    function execute() {

        var errResponse = {
            "errorCode": -1,
            "errorType": "FATAL",
            "errorMessage": "Cannot process request"
        }

        response.setHeader("Content-Type", "application/json");
        response.setStatus(400);
        response.getWriter().print(JSON.stringify(errResponse));
        response.getWriter().flush();

    })();


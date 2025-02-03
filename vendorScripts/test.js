
// Load compatibility script
load("nashorn:mozilla_compat.js");
load(classLoader.getResource("init.js"));

load(classLoader.getResource("workorder-common.js"));
load(classLoader.getResource("tri-workorder-common.js"));

importPackage(java.lang);
importPackage(java.util);
importPackage(java.text);


importPackage(org.apache.commons.fileupload);
importPackage(org.apache.commons.fileupload.disk);
importPackage(org.apache.commons.fileupload.servlet);
importPackage(org.apache.commons.io);
importPackage(com.deloitte.tririga.custom.message);



(function () {

    var log = logger.getDBLogger("vn-test-js");

    /*function execute() {


        var FMUtil = Java.type("com.deloitte.tririga.common.FMUtil")

        var workorderPostTemplate = FMUtil.getResourceAsText("workorder-post-template.txt");


        var currentDate = new java.util.Date(System.currentTimeMillis());

        var compiledTemplate = dust.compile(workorderPostTemplate, "workOrderPost");
        dust.loadSource(compiledTemplate);

        var renderedOutput = "";

        dust.render("workOrderPost", { triExternalTaskIdTX: "9959333524" }, function (error, output) {
            if (error) {
                log.error(error);
            } else {
                renderedOutput = output;
                log.info(output); // output === 'Hello Fred!'
            }
        });

        var testResponse = {
            lastUpdatedTime: new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSSZ").format(currentDate),
            dust_obj: JSON.parse(renderedOutput),
            // "request.getPart()": request.getPart("part")
            serverInfo: request.getSession().getServletContext().getServerInfo(),
            servletInfo: request.getSession().getServletContext().getMajorVersion()
                + "." + request.getSession().getServletContext().getMinorVersion()
        }

        response.setHeader("Content-Type", "application/json");

        response.getWriter().print(JSON.stringify(testResponse));



    }*/

    function doForceFullWorkOrderPost() {

        var requestURI = request.getRequestURI();

        var workOrderId = "";

        var Pattern = Java.type("java.util.regex.Pattern")
        var workOrderIDPattern = Pattern.compile("testJS/[\\w-]*\\d+");

        //log.info("workOrderIDPattern-requestURI :" + workOrderIDPattern + "-" + requestURI);


        var m = workOrderIDPattern.matcher(requestURI);
        if (m.find()) {
            workOrderId = requestURI.substring(m.start() + "testJS/".length(), m.end());
        } else {
            throwError("Cannot read Work Order ID (workOderId) from the request", 400);
        }

        var recordData = new RecordData();

        var attributeSet = new HashSet();

        attributeSet.addAll(["cstWorkTypeTX", "cstRequestClassTX", "triDescriptionTX", "triCommentTX", "triStatusCL", "triNameTX", "cstExternalWorkOrderIDTX", "triModifiedSY", "triRecordIdSY", "cstPriorityClassTX", "triPlannedEndDT", "cstBuildingRecordIDTX", "cstRequestorRecordIdTX", "cstRequestedForRecordIDTX", "cstVZSupervisorRecordIDTX", "cstEXTSupervisorRecordIDTX", "cstResponsiblePersonRecordIDTX", "cstMyProfileRecordIDTX", "cstWorkTaskIdTX"]);


        var attributeMap = new HashMap();

        attributeMap.put("General", attributeSet);

        recordData.setRecordID(-1);
        recordData.setObjectType("cstWorkTaskDTO");
        recordData.setAttributes(attributeMap);
        recordData.setModule("cstIntegration");


        recordData.fillRecordData(tririgaWS, "General", "cstWorkTaskIdTX", workOrderId);

        if (recordData.getRecordData().get("cstWorkTaskIdTX") == null) {
            throwError("Could not find Work Order with ID : " + workOrderId, 404);
            return;
        }

        log.info("calling workOrder post in test method");
        load(classLoader.getResource("workorder-post-create-new.js"));
    }

    function testMultiPartFileUPload() {

        var items = new ServletFileUpload(new DiskFileItemFactory()).parseRequest(request);

        var testResponse = { "items": items.length };

        for (var i = 0; i < items.length; i++) {

            var item = items[i];
            if (item.isFormField()) {
                // Process regular form field (input type="text|radio|checkbox|etc", select, etc).
                var fieldName = item.getFieldName();
                var fieldValue = item.getString();

                testResponse[fieldName] = fieldValue;

                log.info(fieldName + ":" + fieldValue);
                // ... (do your job here)
            } else {
                // Process form file field (input type="file").
                var fieldName = item.getFieldName();
                var fileName = FilenameUtils.getName(item.getName());
                var fileContent = item.getInputStream();

                testResponse["fileName"] = fileName;

                // ... (do your job here)
            }
        }
        response.setHeader("Content-Type", "application/json");

        response.getWriter().print(JSON.stringify(testResponse));
    }

    function testAccess() {

        try {
            var buildingAttributes = ["triRecordIdSY", "triAddressTX", "triCityTX", "cstDISTRICTLI", "cstEnergyManagementSystemCL", "triMainFaxTX", "triMainPhoneTX", "triIdTX", "triNameTX", "cstLocationStyleTX", "cstShopIdCL", "cstShutterControlLI", "triStateProvTX", "cstTerritoryLI", "triZipPostalTX", "cstSecondaryUseTX"];

            var buidingData = fetchRecordData("Location", "triBuilding", "RecordInformation", buildingAttributes, "9999999");
            log.info("buidingData : " + JSON.stringify(buidingData));


            response.getWriter().print(JSON.stringify(buidingData));
        } catch (error) {
            response.getWriter().print(error);
            response.getWriter().print(error.class);
            response.getWriter().print(JSON.stringify(error));

        }

    }

    function fetchRecordData(module, bo, section, fields, recordId) {

        if (recordId == null || recordId.length() == 0)
            return new HashMap();

        log.debug("recordId for lookup : " + recordId);
        var initialTS = System.currentTimeMillis();

        var rd = new RecordData();

        var as = new HashSet();

        as.addAll(fields);

        var am = new HashMap();

        am.put(section, as);

        rd.setRecordID(-1);
        rd.setObjectType(bo);
        rd.setAttributes(am);
        rd.setModule(module);

        rd.fillRecordData(tririgaWS, section, "triRecordIdSY", recordId);

        var totalTimeToFetch = System.currentTimeMillis() - initialTS;

        log.debug("Time to get Data in ms : " + totalTimeToFetch);
        return rd.getRecordData();
    }

    function test() {

        response.getWriter().print(new java.util.Date().getTime());

        response.getWriter().print("\n");

        response.getWriter().print(new java.util.Date().getTime());

    }

    function throwError(message, status) {

        response.setHeader("Content-Type", "application/json");
        response.setStatus(status);

        var errResponse = {
            "errorCode": 0,
            "errorType": "FATAL",
            "errorMessage": message
        }
        response.getWriter().print(JSON.stringify(errResponse));
    }

    function testVendorAuthToken() {

        log.info("BEGIN")

        var API_CONFIG = getAPIContext().get("API_CONFIG");

        if (API_CONFIG == null)
            API_CONFIG = init();


        var responseJSON = {};

        Object.keys(API_CONFIG).forEach((function (vendorCode) {

            var authToken = getOauthToken(vendorCode, API_CONFIG);
            responseJSON[vendorCode] = authToken;

        }));

        log.info("responseJSON:" + responseJSON);

        response.getWriter().print(JSON.stringify(responseJSON));

    }

    function testLog4JTrunc() {

        log.info("BEGIN Trunc");
        var resultData = [];

        try {

            var sqlConn = java.sql.DriverManager.getConnection("jdbc:oracle:thin:@pdb.stagela.verizon.cds.mro.com:11521:tridb",
                "trilog4j", "yk7?bw+Ny+V%Y#>n6");

            //sqlConn.createStatement().executeQuery("INSERT INTO TRILOG4J.INTEGRATION_LOG(TIMESTAMP,LOG_LEVEL) VALUES(SYSTIMESTAMP,'DEBUG')");

            var preparedStatement = sqlConn.prepareStatement("TRUNCATE TABLE INTEGRATION_LOG");
            preparedStatement.executeUpdate();

            preparedStatement.close();
            sqlConn.close();

        } catch (error) {
            response.getWriter().print(JSON.stringify(error));
            return;

        }
    }

    function testLog4J() {

        log.info("BEGIN New");
        var resultData = [];

        try {

            var sqlConn = java.sql.DriverManager.getConnection("jdbc:oracle:thin:@pdb.stagela.verizon.cds.mro.com:11521:tridb",
                "trilog4j", "yk7?bw+Ny+V%Y#>n6");

            //sqlConn.createStatement().executeQuery("INSERT INTO TRILOG4J.INTEGRATION_LOG(TIMESTAMP,LOG_LEVEL) VALUES(SYSTIMESTAMP,'DEBUG')");

            var preparedStatement = sqlConn.prepareStatement("SELECT * FROM (SELECT * FROM INTEGRATION_LOG  ORDER BY TIMESTAMP DESC) WHERE ROWNUM <=500 ");
            var resultSet = preparedStatement.executeQuery();

            var fields = ["TIMESTAMP", "LOG_LEVEL", "THREAD", "MESSAGE", "LOGGER", "NDC"];
            var i = 1;

            var responseHtml = "";


            var FMUtil = Java.type("com.deloitte.tririga.common.FMUtil")
            var headerHtml = FMUtil.getResourceAsText("data-table-header.txt");

            var tableHtml = headerHtml + "<body> <table id='intLog' class='table table-stripe' style='width:100%'><thead><tr>";

            fields.forEach((function (val) {
                tableHtml += java.lang.String.format("<th>%s</th>", val)
            }));
            tableHtml += "</tr></thead>";

            tableHtml += "<tbody>";

            var StringEscapeUtils = Java.type("org.apache.commons.lang.StringEscapeUtils");

            while (resultSet.next()) {

                var result = new HashMap();
                tableHtml += "<tr>";
                fields.forEach((function (val) {
                    tableHtml += java.lang.String.format("<td>%s</td>", StringEscapeUtils.escapeHtml(resultSet.getString(val)))
                }));
                tableHtml += "</tr>";
                // log.info("result:" + result);

                i++;
            }
            tableHtml += "</tbody></body>";

            resultSet.close();
            preparedStatement.close();
            sqlConn.close();

        } catch (error) {
            response.getWriter().print(JSON.stringify(error));
            return;

        }
        // log.info("Sql Query Result : " + resultData);
        // log.debug("DEBUG")

        response.getWriter().print(tableHtml);

    }

    function printRequestHeaders() {
        response.setContentType("text/plain");
        var out = response.getWriter();

        out.println("Request Headers:");
        out.println();
        var names = request.getHeaderNames();
        while (names.hasMoreElements()) {
            var name = names.nextElement();
            var values = request.getHeaders(name);  // support multiple values
            if (values != null) {
                while (values.hasMoreElements()) {
                    var value = values.nextElement();
                    out.println(name + ": " + value);
                }
            }
        }

        out.println(request.getRemoteAddr());
        out.println(request.getRemoteUser());
        out.println(request.getUserPrincipal());

        out.println(request.getHeader("Authorization"));

        var Decoder = Java.type("java.util.Base64").getDecoder();


        var basicAuthHeader = new java.lang.String(Decoder.decode(request.getHeader("Authorization").substring("Basic ".length())));
        out.println(basicAuthHeader.substring(0, basicAuthHeader.indexOf(':')));


        out.println("USER_ACCOUNT_MAPPING:" + USER_ACCOUNT_MAPPING[basicAuthHeader.substring(0, basicAuthHeader.indexOf(':'))]);

        out.println("tririgaWS:" + tririgaWS);

        out.flush();
    }
    function invokeFunction() {
        var invoke = request.getParameter("inv");

        if (invoke == 'testLog4J')
            testLog4J();
        else if (invoke == 'testLog4JTrunc')
            testLog4JTrunc();
        else if (invoke == 'testVendorAuthToken')
            testVendorAuthToken();
        else if (invoke == 'printRequestHeaders')
            printRequestHeaders();
        else if (invoke == 'printLoggers')
            printLoggers();
        else if (invoke == 'testAccess')
            testAccess();
        else if (invoke == 'testEventLog')
            testEventLog(request.getParameter("c"), request.getParameter("wt"));

        else
            test();


    }
    function testEventLog(comments, workTaskID) {
        var eventLogResp = createEventLog(comments, workTaskID);
        var out = response.getWriter();
        out.println(eventLogResp);
    }

    function removeLoggers() {

        response.setContentType("text/plain");

        var loggers = org.apache.log4j.LogManager.getCurrentLoggers();
        var out = response.getWriter();

        while (loggers.hasMoreElements()) {
            var log = loggers.nextElement();

            var appenders = log.getAllAppenders();

            out.println(log.getName())

            var appenderList = new java.util.ArrayList();

            while (appenders.hasMoreElements()) {
                appenderList.add(appenders.nextElement());
            }
            out.println(appenderList)

        }
    }
    function printLoggers() {

        response.setContentType("text/plain");

        var loggers = org.apache.log4j.LogManager.getCurrentLoggers();
        var out = response.getWriter();

        while (loggers.hasMoreElements()) {
            var log = loggers.nextElement();

            var appenders = log.getAllAppenders();

            out.println(log.getName())

            var appenderList = new java.util.ArrayList();

            while (appenders.hasMoreElements()) {
                appenderList.add(appenders.nextElement());
            }
            out.println(appenderList)

        }
    }
    //test();
    //execute();
    //testMultiPartFileUPload();
    //doForceFullWorkOrderPost();
    //testVendorAuthToken();
    //testLog4J();

    invokeFunction();
}
)();



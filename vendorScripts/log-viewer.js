// Load compatibility script
load("nashorn:mozilla_compat.js");
load(classLoader.getResource("workorder-common.js"));

importPackage(java.lang);
importPackage(java.util);
importPackage(java.text);


importPackage(org.apache.commons.fileupload);
importPackage(org.apache.commons.fileupload.disk);
importPackage(org.apache.commons.fileupload.servlet);
importPackage(org.apache.commons.io);
importPackage(com.deloitte.tririga.custom.message);


(function () {

    var log = logger.getDBLogger("vn-log-viewer-js");

    function viewLogs() {

        // log.info("BEGIN New");
        var resultData = [];

        try {


            var maxCount = request.getParameter("mc");

            maxCount = (maxCount == null || maxCount == "") ? 500 : maxCount;

            var loggerLike = request.getParameter("ll");

            loggerLike = (loggerLike == null || loggerLike == "") ? "%" : loggerLike + "%";

            var ndcLike = request.getParameter("nl");
            ndcLike = (ndcLike == null || ndcLike == "") ? "%" : "%"+ ndcLike + "%";


            var sqlConn = java.sql.DriverManager.getConnection(logger.getProps().getProperty("url"),
                logger.getProps().getProperty("user"), logger.getProps().getProperty("password"));

            //sqlConn.createStatement().executeQuery("INSERT INTO TRILOG4J.INTEGRATION_LOG(TIMESTAMP,LOG_LEVEL) VALUES(SYSTIMESTAMP,'DEBUG')");

            // var preparedStatement = sqlConn.prepareStatement("SELECT * FROM (SELECT * FROM INTEGRATION_LOG  WHERE LOGGER LIKE ? ORDER BY TIMESTAMP DESC) WHERE ROWNUM <= ? ");

            var preparedStatement = sqlConn.prepareStatement("SELECT * FROM TRILOG4J.INTEGRATION_LOG  WHERE LOGGER LIKE ? AND NDC LIKE ? ORDER BY TIMESTAMP DESC FETCH FIRST ? ROWS ONLY");

            preparedStatement.setString(1, loggerLike);
            preparedStatement.setString(2, ndcLike);

            preparedStatement.setInt(3, maxCount);

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
            if (sqlConn != null) sqlConn.close();
            response.getWriter().print(error);
            return;

        }
        // log.info("Sql Query Result : " + resultData);
        // log.debug("DEBUG")

        response.getWriter().print(tableHtml);

    }


    viewLogs();
}
)();



// Load compatibility script
load("nashorn:mozilla_compat.js");
load(classLoader.getResource("workorder-common.js"));

importPackage(java.lang);
importPackage(java.util);
importPackage(java.text);
importPackage(java.net);
importPackage(java.io);
importPackage(javax.net.ssl);

importPackage(com.tririga.ws.dto);
importPackage(com.tririga.ws.dto.content);

importPackage(javax.activation);
importPackage(com.deloitte.tririga.custom.message);

importPackage(java.nio.charset);
importPackage(javax.activation);

importPackage(org.apache.commons.io);
importPackage(org.apache.http.client.entity);
importPackage(org.apache.http.util);
importPackage(org.apache.http.impl.client);
importPackage(org.apache.http.client.methods);
importPackage(org.apache.http.message);
importPackage(org.apache.http.impl.client);



(function () {

    var STANDARD_DATE_FORMAT = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX");
    var log = logger.getDBLogger("vn-workorder-retry-js");

    function retryExecute() {

        var rsp = { "responseCode": 0, "responseJSON": "" };

        try {

            log.debug("Before Fetching API_CONFIG");

            var taskData = recordData.getRecordData();

            var API_CONFIG = getAPIContext().get("API_CONFIG");

            if (API_CONFIG == null) API_CONFIG = init();

            var vendorCode = taskData.get("cstVendorIdTX");

            if (API_CONFIG[vendorCode] == null) {
                log.error("cstVendorIdTX is empty,must be one of [C131256,C120297,C122252]");
                return;
            }



            var token = getOauthToken(vendorCode, API_CONFIG);

            var url = API_CONFIG[vendorCode].workOrderEndpointUrl;
            var retryType = taskData.get("cstRetryTypeLI");
            var extWorkOrderId = taskData.get("cstExternalWorkOrderIDTX");
            var dtoSpecId = taskData.get("triRecordIdSY");

            var payload;

            log.debug("Executing Retry for External Vendor Record ID [" + extWorkOrderId + "] Tririga ID [" + dtoSpecId + "] Retry Action : " + retryType + " || Work Task ID [" + taskData.get("cstIdTX") + "]");

            if (retryType == "Work Order Post") {

                payload = readBinaryContent(dtoSpecId, "cstRequestBI");
                rsp = doWorkOrderPost(url, token, payload);

            } else if (retryType == "Work Order Update") {

                payload = readBinaryContent(dtoSpecId, "cstRequestBI");
                rsp = doWorkOrderUpdate(url + "/" + extWorkOrderId, token, payload);

            } else if (retryType == "Work Order Log Notes") {

                payload = readBinaryContent(dtoSpecId, "cstRequestBI");
                rsp = doLogNotesAndStatusUpdate(url + "/" + extWorkOrderId + "/logNotes", token, payload);

            } else if (retryType == "Work Order Status Update") {

                payload = readBinaryContent(dtoSpecId, "cstRequestBI");
                rsp = doLogNotesAndStatusUpdate(url + "/" + extWorkOrderId + "/statusUpdate", token, payload);

            } else if (retryType == "Work Order Upload Image") {

                rsp = doUploadImage(url + "/" + extWorkOrderId + "/uploadImage", token, taskData);

            } else {
                log.error("Retry Type " + retryType + " is not Supported");
                return;
            }

        } catch (error) {
            log.error("Internal Error happened on Retry!! " + error);
            //return;
        }

        recordData.getRecordData().put("cstStatusCodeTX", rsp.responseCode + "");

        var retry = recordData.getRecordData().get("triCountNU");
        log.debug("Old Retry Count : " + retry);
        if (retry == null || retry == "0")
            recordData.getRecordData().put("triCountNU", "1");
        else
            recordData.getRecordData().put("triCountNU", (java.lang.Long.parseLong(retry) + 1) + "");

        log.debug("New Retry Count : " + recordData.getRecordData().get("triCountNU"));

        if (rsp.responseCode == 400) {
            recordData.getRecordData().put("triUserMessageTX", rsp.responseJSON + "");
        }

        if (rsp.responseCode != null && rsp.responseCode >= 200 && rsp.responseCode < 300) {
            log.debug("Processed BL Marked as True")
            recordData.getRecordData().put("cstExternalWorkOrderIDTX", rsp.responseJSON.workOrderId + "");
            recordData.getRecordData().put("cstMessageTX", java.lang.String.format("[%s]:%s", rsp.responseJSON.code, rsp.responseJSON.message));
            recordData.getRecordData().put("cstProcessedBL", "True");
        }

        recordData.saveRecordData(tririgaWS, "cstSave");
    }

    function doWorkOrderPost(httpURL, token, payload) {
        var url = new URL(httpURL);
        var conn = url.openConnection();

        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("Authorization", token);

        conn.setDoOutput(true);

        var bw = new BufferedWriter(new OutputStreamWriter(conn.getOutputStream()));

        bw.write(payload);
        bw.close();

        var responseCode = conn.getResponseCode();
        var responseJSON = readHttpRequestResponse(conn, responseCode);

        return { "responseCode": responseCode, "responseJSON": responseJSON };
    }

    function doWorkOrderUpdate(httpURL, token, payload) {
        var url = new URL(httpURL);
        var conn = url.openConnection();

        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("Authorization", token);
        conn.setRequestMethod("PUT");

        conn.setDoOutput(true);

        var bw = new BufferedWriter(new OutputStreamWriter(conn.getOutputStream()));

        bw.write(payload);
        bw.close();

        var responseCode = conn.getResponseCode();
        var responseJSON = readHttpRequestResponse(conn, responseCode);

        return { "responseCode": responseCode, "responseJSON": responseJSON };
    }

    function doLogNotesAndStatusUpdate(httpURL, token, payload) {
        var url = new URL(httpURL);
        var conn = url.openConnection();

        conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
        conn.setRequestProperty("Authorization", token);
        conn.setRequestMethod("PUT");
        conn.setDoOutput(true);

        var bw = new BufferedWriter(new OutputStreamWriter(conn.getOutputStream()));

        bw.write(payload);
        bw.close();

        var responseCode = conn.getResponseCode();
        var responseJSON = readHttpRequestResponse(conn, responseCode);

        return { "responseCode": responseCode, "responseJSON": responseJSON };
    }

    function doUploadImage(httpURL, token, taskData) {
        var download = getContent(taskData.get("triRecordIdSY"), "triImageIM");
        var dataHandler = download.getContent();
        var fileName = download.getFileName();
        var fileLength = download.getLength();

        log.debug("fileName : " + fileName);
        log.debug("fileLength : " + fileLength);
        var fileByteContent = getByteFromInputStream(dataHandler.getInputStream());

        var workOrderURL = new URL(httpURL);
        var boundary = boundary = UUID.randomUUID().toString();
        var LINE = "\r\n";
        var charset = "UTF-8";

        var conn = workOrderURL.openConnection();
        conn.setRequestProperty("Authorization", token);
        conn.setRequestMethod("POST");
        conn.setDoOutput(true);
        conn.setUseCaches(false);
        conn.setDoInput(true);
        conn.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + boundary);
        log.debug("Setting Boundary : " + boundary);
        var outputStream = conn.getOutputStream();
        var writer = new PrintWriter(new OutputStreamWriter(outputStream, charset), true);

        writer.append("--" + boundary).append(LINE);
        writer.append("Content-Disposition: form-data; name=\"description\"").append(LINE);
        writer.append("Content-Type: text/plain; charset=" + charset).append(LINE);
        writer.append(LINE);
        writer.append(taskData.get("cstNotesTX")).append(LINE);
        writer.flush();

        writer.append("--" + boundary).append(LINE);
        writer.append("Content-Disposition: form-data; name=\"image\"; filename=\"" + fileName + "\"").append(LINE);
        writer.append("Content-Type: " + URLConnection.guessContentTypeFromName(fileName)).append(LINE);
        writer.append("Content-Transfer-Encoding: binary").append(LINE);
        writer.append(LINE);
        writer.flush();

        outputStream.write(fileByteContent);
        outputStream.flush();

        writer.append(LINE);
        writer.flush();

        writer.append("--" + boundary + "--").append(LINE);
        writer.flush();
        writer.close();

        var responseCode = conn.getResponseCode();
        var responseJSON = readHttpRequestResponse(conn, responseCode);

        return { "responseCode": responseCode, "responseJSON": responseJSON };
    }

    function readHttpRequestResponse(conn, responseCode) {

        var responseStringBuffer = new StringBuffer("");

        log.debug("Response Code from External System : " + responseCode);

        var is = null;

        if (responseCode >= 200 && responseCode < 300) {
            is = conn.getInputStream();
        } else {
            is = conn.getErrorStream();
        }

        if (is != null) {
            var isr = new InputStreamReader(is);
            var br = new BufferedReader(isr);

            while ((inputLine = br.readLine()) != null) {
                responseStringBuffer.append(inputLine);
            }
        }

        log.info("Response from External System : " + responseStringBuffer)
        if (responseCode >= 200 && responseCode < 300) {
            return JSON.parse(responseStringBuffer);
        } else {
            return responseStringBuffer;
        }
    }

    retryExecute();
})();

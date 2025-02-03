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

	var log = logger.getDBLogger("vn-workorder-post-upload-image-js");


	function execute() {

		var responseStringBuffer = new StringBuffer("");
		var resp = "";
		var encoded = "";

		try {

			log.debug("Before Fetching API_CONFIG");

			var API_CONFIG = getAPIContext().get("API_CONFIG");

			if (API_CONFIG == null) API_CONFIG = init();

			var vendorCode = recordData.getRecordData().get("cstVendorIdTX");

			if (API_CONFIG[vendorCode] == null) {
				log.error("cstVendorIdTX is empty,must be one of [C131256,C120297,C122252]");
				return;
			}

			var workOrderEndpointURL = API_CONFIG[vendorCode].workOrderEndpointUrl;

			var urlToTrigger = workOrderEndpointURL + "/" + recordData.getRecordData().get("cstExternalWorkOrderIDTX") + "/uploadImage";
			log.info("Posting to: " + urlToTrigger);

			var download = getContent(recordData.getRecordData().get("triRecordIdSY"), "triImageIM");
			var dataHandler = download.getContent();
			var fileName = download.getFileName();
			var fileLength = download.getLength();
			log.info(java.lang.String.format("fileName:[%s] of size[%s] ", fileName,fileLength));

			var fileByteContent = getByteFromInputStream(dataHandler.getInputStream());

			var LINE = "\r\n";
			var resp = "Time Stamp of Request: " + STANDARD_DATE_FORMAT.format(System.currentTimeMillis()) + LINE + "description : " + recordData.getRecordData().get("cstNotesTX") + LINE + "externalWorkOrderId:" + recordData.getRecordData().get("cstWorkTaskIdTX") + LINE;

			var encoded = "File Content : " + LINE + Base64.getEncoder().encodeToString(fileByteContent);

			var authToken = getOauthToken(vendorCode, API_CONFIG);

			var workOrderURL = new URL(urlToTrigger);
			var boundary = boundary = UUID.randomUUID().toString();
			var charset = "UTF-8";

			var conn = workOrderURL.openConnection();
			conn.setRequestProperty("Authorization", authToken);
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
			writer.append(recordData.getRecordData().get("cstNotesTX")).append(LINE);
			writer.flush();

			writer.append("--" + boundary).append(LINE);
			writer.append("Content-Disposition: form-data; name=\"externalWorkOrderId\"").append(LINE);
			writer.append("Content-Type: text/plain; charset=" + charset).append(LINE);
			writer.append(LINE);
			writer.append(recordData.getRecordData().get("cstWorkTaskIdTX")).append(LINE);
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
			log.debug("Response Code from External System : " + responseCode);
			recordData.getRecordData().put("cstStatusCodeTX", responseCode + "");

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


			log.info("Response From External System : " + responseStringBuffer.toString());

			if (responseCode >= 200 && responseCode < 300) {
				var responseJSON = JSON.parse(responseStringBuffer);
				log.debug("responseJSON.workOrderId:" + responseJSON.workOrderId);
				recordData.getRecordData().put("triUserMessageTX", "");
				recordData.getRecordData().put("cstExternalWorkOrderIDTX", responseJSON.workOrderId + "");
				recordData.getRecordData().put("cstMessageTX", java.lang.String.format("[%s]:%s", responseJSON.code, responseJSON.message));
			} else {
				log.error("Error occurred while posting data");
				if (responseCode != 400) {
					recordData.getRecordData().put("cstErrorFlagBL", "true");
					recordData.getRecordData().put("cstRetryTypeLI", "Work Order Upload Image");
					recordData.getRecordData().put("triUserMessageTX", "Unexpected error occured with External System");
				} else {
					var responseJSON = JSON.parse(responseStringBuffer);
					recordData.getRecordData().put("triUserMessageTX", responseJSON.errorMessage + "");
				}
			}

			recordData.saveRecordData(tririgaWS, "cstSave");

		} catch (error) {
			log.error(error);
			responseStringBuffer.append(error);
			recordData.getRecordData().put("cstErrorFlagBL", "true");
			recordData.getRecordData().put("cstRetryTypeLI", "Work Order Upload Image");
			recordData.getRecordData().put("triUserMessageTX", error + ". Internal Server Error Occured , Please contact System Administrator");
			recordData.saveRecordData(tririgaWS, "cstSave");

		}
		log.info("responseStringBuffer:" + responseStringBuffer);

		saveRequestResponse(recordData.getRecordID(), resp + encoded, responseStringBuffer.toString());
	}

	execute();


})();
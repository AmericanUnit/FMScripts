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

importPackage(org.apache.http.client.entity);
importPackage(org.apache.http.util);
importPackage(org.apache.http.impl.client);
importPackage(org.apache.http.client.methods);
importPackage(org.apache.http.message);
importPackage(org.apache.http.impl.client);


(function () {


	var STANDARD_DATE_FORMAT = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX");

	var log = logger.getDBLogger("vn-workorder-put-log-notes-js");


	function execute() {

		var requestPayload = "";
		var responseStringBuffer = new StringBuffer("");

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

			var params = new HashMap();
			var note = recordData.getRecordData().get("cstNotesTX") == null ? "" : recordData.getRecordData().get("cstNotesTX");

			log.debug("Sending Log Note : " +  note);

			params.put("notes", note);
			params.put("externalWorkOrderId",recordData.getRecordData().get("cstWorkTaskIdTX"));

			requestPayload = getDataString(params);

			var authToken = getOauthToken(vendorCode, API_CONFIG);

			var urlToTrigger = workOrderEndpointURL + "/" + recordData.getRecordData().get("cstExternalWorkOrderIDTX") + "/logNotes";
			log.info("Posting to: " + urlToTrigger);
			log.info("requestPayload: " + requestPayload);

			var workOrderURL = new URL(urlToTrigger);
			var conn = workOrderURL.openConnection();
			// conn.setSSLSocketFactory(boConfig.getIntegrationParameters().getSSLContext().getSocketFactory());
			conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
			conn.setRequestProperty("Authorization", authToken);
			conn.setRequestMethod("PUT");
			conn.setDoOutput(true);

			var bw = new BufferedWriter(new OutputStreamWriter(conn.getOutputStream()));
			bw.write(requestPayload);
			bw.close();

			var responseCode = conn.getResponseCode();
			log.debug("Response Code from External System : " + responseCode);
			recordData.getRecordData().put("cstStatusCodeTX", responseCode+"");

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

			log.debug("Response From External System : " + responseStringBuffer.toString());

			

			if (responseCode >= 200 && responseCode < 300) {
				var responseJSON = JSON.parse(responseStringBuffer);
				log.debug("responseJSON.workOrderId:" + responseJSON.workOrderId);
				recordData.getRecordData().put("triUserMessageTX", "");
				recordData.getRecordData().put("cstExternalWorkOrderIDTX", responseJSON.workOrderId + "");
				recordData.getRecordData().put("cstMessageTX", java.lang.String.format("[%s]:%s", responseJSON.code, responseJSON.message));

			} else {
				log.error("Error occurred while posting data");
				if(responseCode != 400){
					recordData.getRecordData().put("cstErrorFlagBL", "true");
					recordData.getRecordData().put("cstRetryTypeLI", "Work Order Log Notes");
					recordData.getRecordData().put("triUserMessageTX", "Unexpected error occured with External System");
				}else{
					var responseJSON = JSON.parse(responseStringBuffer);
					recordData.getRecordData().put("triUserMessageTX", responseJSON.errorMessage + "");
				}
			}

			recordData.saveRecordData(tririgaWS, "cstSave");


		} catch (error) {
			log.error(error);
			responseStringBuffer.append(error);
			recordData.getRecordData().put("cstErrorFlagBL", "true");
			recordData.getRecordData().put("cstRetryTypeLI", "Work Order Log Notes");
			
			recordData.getRecordData().put("triUserMessageTX", error + ". Internal Server Error Occured , Please contact System Administrator");
			recordData.saveRecordData(tririgaWS, "cstSave");

			// return;
		}
		log.info("responseStringBuffer:" + responseStringBuffer);



		saveRequestResponse(recordData.getRecordID(), requestPayload,
			responseStringBuffer.toString());
	}

	execute();


})();


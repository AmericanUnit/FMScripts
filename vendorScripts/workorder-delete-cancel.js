// Load compatibility script
load("nashorn:mozilla_compat.js");

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

importPackage(org.apache.http.entity);

importPackage(org.apache.http.client.methods);


(function () {


	var STANDARD_DATE_FORMAT = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX");

	var log = org.apache.log4j.Logger.getLogger("vendor-post-workorder-js");

	function init() {




		var API_CONFIG = JSON.parse(com.deloitte.tririga.common.FMUtil.getResourceAsText("api-config.json"));

		getAPIContext().put("API_CONFIG", API_CONFIG);

		log.info("Initialized API Config with:" + JSON.stringify(API_CONFIG));

		return API_CONFIG;

	}
	function execute() {

		var responseStringBuffer = new StringBuffer("")

		var HttpClients = Java.type("org.apache.http.impl.client.HttpClients");

		var ContentType = Java.type("org.apache.http.entity.ContentType");


		var httpClient = HttpClients.createDefault();


		var API_CONFIG = getAPIContext().get("API_CONFIG");

		if (API_CONFIG == null) API_CONFIG = init();

		var vendorCode = recordData.getRecordData().get("cstVendorIdTX");

		if (API_CONFIG[vendorCode] == null) {
			log.error("cstVendorIdTX is empty,must be one of [C131256,C120297,C122252]");
			return;
		}


		var workOrderEndpointURL = API_CONFIG[vendorCode].workOrderEndpointUrl;
		var vendorOAuthEndpointURL = API_CONFIG[vendorCode].oAuthConfig.url;
		var oAuthRequestPayload = API_CONFIG[vendorCode].oAuthConfig.requestPayload;

		var oAuthPost = new HttpPost(vendorOAuthEndpointURL);

		log.info("Authenticating against:" + vendorOAuthEndpointURL);


		var oAuthUrl = new URL(vendorOAuthEndpointURL);
		var conn = oAuthUrl.openConnection();

		// conn.setSSLSocketFactory(boConfig.getIntegrationParameters().getSSLContext().getSocketFactory());

		conn.setRequestProperty("Content-Type", "application/json");
		conn.setDoOutput(true);

		var bw = new BufferedWriter(new OutputStreamWriter(conn.getOutputStream()));

		bw.write(JSON.stringify(oAuthRequestPayload));
		bw.close();


		var is = conn.getInputStream();
		var isr = new InputStreamReader(is);
		var br = new BufferedReader(isr);


		while ((inputLine = br.readLine()) != null) {
			responseStringBuffer.append(inputLine);
		}


		var accessToken = JSON.parse(responseStringBuffer.toString()).access_token;


		log.info("Auth Response:" + accessToken);


		responseStringBuffer.delete(0, responseStringBuffer.length());


		log.info("Posting to:" + workOrderEndpointURL);

		var requestPost = new HttpPost(workOrderEndpointURL);

		var recordDataMap = recordData.getRecordData();

		var priority = recordDataMap.get("cstPriorityClassTX");

		priority = priority != null ? java.lang.Integer.parseInt(priority.substring(1)) : 3;

		var taskType = recordDataMap.get("cstTaskTypeTX");

		taskType = taskType === "Corrective" ? "CM" : "PM";

		var currentdate = new java.util.Date(System.currentTimeMillis());

		var requestTemplate = {
			"externalWorkOrderId": recordDataMap.get("cstWorkTaskIdTX"),
			"requestedBy": recordDataMap.get("cstRequesterTX") + "",
			"requestedPhone": recordDataMap.get("cstPhoneTX") + "",
			"requestedEmail": recordDataMap.get("cstEmailTX") + "",
			"requestDate": STANDARD_DATE_FORMAT.format(currentdate),
			"workType": recordDataMap.get("cstWorkTypeTX"),
			"problemType": recordDataMap.get("cstRequestClassTX") + "",
			"type": taskType,
			"priority": priority,
			"locationDetails": {
				"propertyCode": recordDataMap.get("triIdTX"),
				"phone": recordDataMap.get("cstPhoneTX") + "",
				"fax": recordDataMap.get("cstFaxTX") + "",
				"address": recordDataMap.get("cstAddress1TX") + "",
				"city": recordDataMap.get("cstCity2TX") + "",
				"state": recordDataMap.get("cstState2TX") + "",
				"zip": recordDataMap.get("triZipPostalTX") + ""
			},
			"workOrderDescription": recordDataMap.get("triDescriptionTX") + "",
			"additionalInstructions": recordDataMap.get("triCommentTX") + ""
		}

		/*
		requestPost.setEntity(new StringEntity(JSON.stringify(requestTemplate)));
		var soapInvokeResponse = httpClient.execute(requestPost);
*/


		var workOrderURL = new URL(workOrderEndpointURL);
		conn = workOrderURL.openConnection();
		// conn.setSSLSocketFactory(boConfig.getIntegrationParameters().getSSLContext().getSocketFactory());
		conn.setRequestProperty("Content-Type", "application/json");
		conn.setRequestProperty("Authorization", "Bearer " + accessToken);

		conn.setDoOutput(true);

		var bw = new BufferedWriter(new OutputStreamWriter(conn.getOutputStream()));

		bw.write(JSON.stringify(requestTemplate));
		bw.close();


		var responseCode = conn.getResponseCode();

		try {

			var is = null;

			if (responseCode >= 200 && responseCode < 300) {
				is = conn.getInputStream();
			} else {
				is = conn.getErrorStream();
			}

			var isr = new InputStreamReader(is);
			var br = new BufferedReader(isr);


			while ((inputLine = br.readLine()) != null) {
				responseStringBuffer.append(inputLine);
			}

			var responseJSON = JSON.parse(responseStringBuffer);

			if (responseCode >= 200 && responseCode < 300) {
				log.info("responseJSON.workOrderId:" + responseJSON.workOrderId);
				recordData.getRecordData().put("triUserMessageTX", "");
				recordData.getRecordData().put("cstExternalWorkOrderIDTX", responseJSON.workOrderId + "");
			} else {
				log.error("Error occurred while posting data");
				recordData.getRecordData().put("triUserMessageTX", responseJSON.errorMessage + "");
			}

			recordData.saveRecordData(tririgaWS, "cstSave");


		} catch (error) {
			log.error(error);
			responseStringBuffer.append(error);
			recordData.getRecordData().put("cstErrorFlagBL", "true");
			recordData.getRecordData().put("triUserMessageTX", responseCode + ":" + conn.getResponseMessage());
			recordData.saveRecordData(tririgaWS, "cstSave");

			// return;
		}
		log.info("responseStringBuffer:" + responseStringBuffer);



		saveRequestResponse(recordData.getRecordID(), JSON.stringify(requestTemplate),
			responseStringBuffer.toString());
	}

	function saveRequestResponse(specID, requestXML, responseXML) {


		var FileUtils = Java.type("org.apache.commons.io.FileUtils");
		var File = Java.type("java.io.File");


		var tmpFile = File.createTempFile("requestXML", ".txt");
		FileUtils.writeByteArrayToFile(tmpFile, requestXML.getBytes());

		var fileDS = new FileDataSource(tmpFile);
		var dataHandler = new DataHandler(fileDS);

		var content = new Content();
		content.setRecordId(specID);
		content.setContent(dataHandler);
		content.setFieldName("cstRequestBI");
		content.setFileName("requestXML.txt");

		var upload = tririgaWS.upload(content);
		tmpFile.delete();


		tmpFile = File.createTempFile("responseXML", ".txt");
		FileUtils.writeByteArrayToFile(tmpFile, responseXML.getBytes());

		var fileDS = new FileDataSource(tmpFile);
		var dataHandler = new DataHandler(fileDS);

		var content = new Content();
		content.setRecordId(specID);
		content.setContent(dataHandler);
		content.setFieldName("cstResponseBI");
		content.setFileName("responseXML.txt");

		var upload = tririgaWS.upload(content);
		tmpFile.delete();
	}
	execute();


})();


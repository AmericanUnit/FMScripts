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

importPackage(org.apache.http.entity);

importPackage(org.apache.http.client.methods);


(function () {


	var STANDARD_DATE_FORMAT = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX");

	var log = logger.getDBLogger("vn-vendor-put-workorder-update-js");

	var na = "NA";

	function execute() {

		var requestTemplate = "";
		var responseStringBuffer = new StringBuffer("");

		try {

			var API_CONFIG = getAPIContext().get("API_CONFIG");

			if (API_CONFIG == null) API_CONFIG = init();

			var vendorCode = recordData.getRecordData().get("cstVendorIdTX");

			if (API_CONFIG[vendorCode] == null) {
				log.error("cstVendorIdTX is empty,must be one of [C131256,C120297,C122252]");
				return;
			}

			var workOrderEndpointURL = API_CONFIG[vendorCode].workOrderEndpointUrl;

			var recordDataMap = recordData.getRecordData();

			var priority = recordDataMap.getOrDefault("cstPriorityClassTX", na);

			priority = priority != null ? java.lang.Integer.parseInt(priority.substring(1)) : 3;

			var taskType = recordDataMap.getOrDefault("cstTaskTypeTX", na);

			taskType = taskType === "Corrective" ? "CM" : "PM";

			var currentdate = new java.util.Date(System.currentTimeMillis());
			var plannedEndDate = new java.util.Date(java.lang.Long.parseLong(recordDataMap.get("triPlannedEndDT")));

			log.info("DTO DATA : " + recordDataMap);

			var buildingAttributes = ["triRecordIdSY", "triAddressTX", "triCityTX", "cstDISTRICTLI", "cstEnergyManagementSystemCL", "triMainFaxTX", "triMainPhoneTX", "triIdTX", "triNameTX", "cstLocationStyleTX", "cstShopIdCL", "cstShutterControlLI", "triStateProvTX", "cstTerritoryLI", "triZipPostalTX", "cstSecondaryUseTX"];
			var contactAttributes = ["triNameTX", "triWorkPhoneTX", "triEmailTX", "triRecordIdSY"];
			var myProfileAttributes = ["triApprovalAmountNU"];

			var buildingData = fetchRecordData("Location", "triBuilding", "RecordInformation", buildingAttributes, recordDataMap.get("cstBuildingRecordIDTX"));
			log.info("buidingData : " + buildingData);
			var requestorData = fetchRecordData("triPeople", "triPeople", "Detail", contactAttributes, recordDataMap.get("cstRequestorRecordIdTX"));
			log.info("requestorData : " + requestorData);
			var requestedForData = fetchRecordData("triPeople", "triPeople", "Detail", contactAttributes, recordDataMap.get("cstRequestedForRecordIDTX"));
			log.info("requestedForData : " + requestedForData);
			var vzSupervisorData = fetchRecordData("triPeople", "triPeople", "Detail", contactAttributes, recordDataMap.get("cstVZSupervisorRecordIDTX"));
			log.info("vzSupervisorData : " + vzSupervisorData);
			var extSupervisorData = fetchRecordData("triPeople", "triPeople", "Detail", contactAttributes, recordDataMap.get("cstEXTSupervisorRecordIDTX"));
			log.info("extSupervisorData : " + extSupervisorData);
			var responsiblePersonData = fetchRecordData("triPeople", "triPeople", "Detail", contactAttributes, recordDataMap.get("cstResponsiblePersonRecordIDTX"));
			log.info("responsiblePersonData : " + responsiblePersonData);
			var assigneeMyProfileData = fetchRecordData("triPeople", "My Profile", "RecordInformation", myProfileAttributes, recordDataMap.get("cstMyProfileRecordIDTX"));
			log.info("assigneeMyProfileData : " + assigneeMyProfileData);

			var requestTemplate = {
				"externalWorkOrderId": getNSV(recordDataMap.get("cstWorkTaskIdTX")),
				"requestedBy": getNSV(requestedForData.get("triNameTX")),
				"requestedPhone": getNSV(requestedForData.get("triWorkPhoneTX")),
				"requestedEmail": getNSV(requestedForData.get("triEmailTX")),
				"requestDate": STANDARD_DATE_FORMAT.format(currentdate),
				"workType": getNSV(recordDataMap.get("cstWorkTypeTX")),
				"problemType": getNSV(recordDataMap.get("cstRequestClassTX")),
				"type": taskType,
				"priority": priority,
				"plannedEndDate": STANDARD_DATE_FORMAT.format(plannedEndDate),
				"notToExceed": getNumberNSV(assigneeMyProfileData.get("triApprovalAmountNU")),
				"requestor": {
					"name": getNSV(requestorData.get("triNameTX")),
					"email": getNSV(requestorData.get("triEmailTX")),
					"phone": getNSV(requestorData.get("triWorkPhoneTX"))
				},
				"requestedFor": {
					"name": getNSV(requestedForData.get("triNameTX")),
					"email": getNSV(requestedForData.get("triEmailTX")),
					"phone": getNSV(requestedForData.get("triWorkPhoneTX"))
				},
				"responsiblePerson": {
					"name": getNSV(responsiblePersonData.get("triNameTX")),
					"email": getNSV(responsiblePersonData.get("triEmailTX")),
					"phone": getNSV(responsiblePersonData.get("triWorkPhoneTX"))
				},
				"workOrderDescription": getNSV(recordDataMap.get("triDescriptionTX")),
				"additionalInstructions": getNSV(recordDataMap.get("triCommentTX")),
				"locationDetails": {
					"propertyCode": getNSV(buildingData.get("triIdTX")),
					"propertyName": getNSV(buildingData.get("triNameTX")),
					"phone": getNSV(buildingData.get("triMainPhoneTX")),
					"fax": getNSV(buildingData.get("triMainFaxTX")),
					"address": getNSV(buildingData.get("triAddressTX")),
					"city": getNSV(buildingData.get("triCityTX")),
					"state": getNSV(buildingData.get("triStateProvTX")),
					"zip": getNSV(buildingData.get("triZipPostalTX")),
					"district": getNSV(buildingData.get("cstDISTRICTLI")),
					"locationStyle": getNSV(buildingData.get("cstLocationStyleTX")),
					"shutterControl": getNSV(buildingData.get("cstShutterControlLI")),
					"leedDesignation": na,
					"emsDesignation": getNSV(buildingData.get("cstEnergyManagementSystemCL")),
					"territory": getNSV(buildingData.get("cstTerritoryLI")),
					"shopID": getNSV(buildingData.get("cstShopIdCL")),
					"secondaryUse": getNSV(buildingData.get("cstSecondaryUseTX")),
					"vzPropertySupervisor": {
						"name": getNSV(vzSupervisorData.get("triNameTX")),
						"email": getNSV(vzSupervisorData.get("triEmailTX")),
						"phone": getNSV(vzSupervisorData.get("triWorkPhoneTX"))
					},
					"extPropertySupervisor": {
						"name": getNSV(extSupervisorData.get("triNameTX")),
						"email": getNSV(extSupervisorData.get("triEmailTX")),
						"phone": getNSV(extSupervisorData.get("triWorkPhoneTX"))
					}
				}
			}


			var authToken = getOauthToken(vendorCode, API_CONFIG);

			var urlToTrigger = workOrderEndpointURL + "/" + recordData.getRecordData().get("cstExternalWorkOrderIDTX");
			log.info("Posting to: " + urlToTrigger);
			log.info("requestPayload: " +  JSON.stringify(requestTemplate));

			var workOrderURL = new URL(urlToTrigger);
			var conn = workOrderURL.openConnection();
			// conn.setSSLSocketFactory(boConfig.getIntegrationParameters().getSSLContext().getSocketFactory());
			conn.setRequestProperty("Content-Type", "application/json");
			conn.setRequestProperty("Authorization", authToken);
			conn.setRequestMethod("PUT");
			conn.setDoOutput(true);

			var bw = new BufferedWriter(new OutputStreamWriter(conn.getOutputStream()));

			bw.write(JSON.stringify(requestTemplate));
			bw.close();

			var responseCode = conn.getResponseCode();
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

			if (responseCode >= 200 && responseCode < 300) {
				var responseJSON = JSON.parse(responseStringBuffer);
				log.info("responseJSON.workOrderId:" + responseJSON.workOrderId);
				recordData.getRecordData().put("triUserMessageTX", "");
				recordData.getRecordData().put("cstExternalWorkOrderIDTX", responseJSON.workOrderId + "");
				recordData.getRecordData().put("cstMessageTX", java.lang.String.format("[%s]:%s", responseJSON.code, responseJSON.message));

			} else {
				log.error("Error occurred while posting data");
				if (responseCode != 400) {
					recordData.getRecordData().put("cstErrorFlagBL", "true");
					recordData.getRecordData().put("cstRetryTypeLI", "Work Order Update");
					recordData.getRecordData().put("triUserMessageTX", "Unexpected error occured with External System");
				} else {
					var responseJSON = JSON.parse(responseStringBuffer);
					recordData.getRecordData().put("triUserMessageTX", responseJSON.errorMessage + "");
				}

			}

			recordData.saveRecordData(tririgaWS, "cstSave");


		} catch (error) {
			log.error(error);

			if(error instanceof com.tririga.ws.errors.AccessException){
				log.error("Falling back to elevated privilged action")
				return;
			}

			responseStringBuffer.append(error);
			recordData.getRecordData().put("cstErrorFlagBL", "true");
			recordData.getRecordData().put("cstRetryTypeLI", "Work Order Post");
			recordData.getRecordData().put("triUserMessageTX", error + ". Internal Server Error Occured , Please contact System Administrator");
			recordData.saveRecordData(tririgaWS, "cstSave");

			// return;
		}
		log.info("responseStringBuffer:" + responseStringBuffer);



		saveRequestResponse(recordData.getRecordID(), JSON.stringify(requestTemplate),
			responseStringBuffer.toString());
	}

	function getNSV(val) {
		if (val == null || val.length() == 0)
			return na;
		return val;
	}

	function getNumberNSV(val) {
		if (val == null)
			return 0;
		return java.lang.Long.parseLong(val);
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



	execute();
})();


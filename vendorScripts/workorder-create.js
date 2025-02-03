// Load compatibility script
load("nashorn:mozilla_compat.js");

importPackage(java.lang);
importPackage(java.util);
importPackage(java.text);

importPackage(org.json);
importPackage(java.io);
importPackage(java.util);

importPackage(com.tririga.ws.dto);
importPackage(com.tririga.ws.dto.content);

importPackage(javax.activation);
importPackage(com.deloitte.tririga.custom.message);

importPackage(java.nio.charset);
importPackage(javax.activation);

(function () {


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
	function execute() {


		var log = org.apache.log4j.Logger.getLogger("workorder-inbound-create-js-log");


		var inputStream = request.getInputStream();

		var jsonData = Array(request.getContentLength());

		jsonData = Java.to(jsonData, "byte[]");

		var bis = new BufferedInputStream(inputStream);

		bis.read(jsonData, 0, jsonData.length);

		var requestJSONString = "";

		if (request.getCharacterEncoding() != null) {
			requestJSONString = new java.lang.String(jsonData, request.getCharacterEncoding());
		} else {
			requestJSONString = new java.lang.String(jsonData);
		}

		log.info("Request:" + requestJSONString);

		var root = JSON.parse(requestJSONString);

		/*
			cstFromExternalSystemTX : "TRUE" wont be needed in future, its just part of throw-away integrtion
		*/
		var tranformMap = {
			General: {
				cstExternalWorkOrderIDTX: root.externalWorkOrderId + "",
				triNameTX: "VN-" + root.externalWorkOrderId,
				cstRequesterTX: root.requestedBy,
				cstPhoneTX: root.requestedPhone,
				cstEmailTX: root.requestedEmail,
				cstWorkTypeTX: root.workType,
				cstPlannedEndTX: root.requestDate + "",
				cstRequestClassTX: root.problemType + "",
				triIdTX: root.locationDetails.propertyCode,
				cstPriorityClassTX: "P" + root.priority + "",
				triDescriptionTX: root.workOrderDescription + "",
				triCommentTX: root.additionalInstructions + "",
				cstFromExternalSystemTX: "TRUE"
			}
		};

		log.debug("tranformMap:" + JSON.stringify(tranformMap));

		var integrationRecordArray = [];

		var integrationRecord = new IntegrationRecord();
		integrationRecord.setModuleId(tririgaWS.getModuleId("cstIntegration"));
		integrationRecord.setObjectTypeId(tririgaWS.getObjectTypeId("cstIntegration", "cstWorkTaskDTO"));

		var integrationSection = new IntegrationSection();
		integrationSection.setName("General");

		var guis = tririgaWS.getGUIsByName("cstWorkTaskDTO", "cstIntegration");

		var triWorkTaskGuiId = "";

		for (var i = 0; i < guis.length; i++) {
			if (guis[i].getName().equals("cstExternalWorkTaskDTO")) {
				triWorkTaskGuiId = guis[i].getId();
				integrationRecord.setGuiId(guis[i].getId());;
				break;
			}
		};

		var integrationFieldArray = [];

		integrationRecord.setObjectTypeName("cstWorkTaskDTO");
		integrationRecord.setId(-1);
		integrationRecord.setActionName("cstInboundCreate");

		Object.keys(tranformMap.General).forEach((function (col) {
			var integrationField = new IntegrationField();
			integrationField.setName(col);
			integrationField.setValue(tranformMap.General[col]);

			//log.debug("integrationField=>" + integrationField.getName() + ":" + integrationField.getValue())
			integrationFieldArray.push(integrationField);
		}));

		integrationSection.setFields(integrationFieldArray);

		var intSectionArray = [integrationSection];
		integrationRecord.setSections(intSectionArray);

		integrationRecordArray.push(integrationRecord);


		var triResponse = tririgaWS.saveRecord(integrationRecordArray)

		var workTaskDTORecord = new RecordData();

		var workTaskDTOAttributeSet = new HashSet();
		workTaskDTOAttributeSet.addAll(["cstWorkTaskIdTX", "triModifiedSY", "triRecordIdSY", "cstExternalWorkOrderIDTX"]);

		var workTaskDTOAttributeMap = new HashMap();
		workTaskDTOAttributeMap.put("General", workTaskDTOAttributeSet);

		workTaskDTORecord.setRecordID(triResponse.getResponseHelpers()[0].getRecordId());
		workTaskDTORecord.setObjectType("cstWorkTaskDTO");
		workTaskDTORecord.setAttributes(workTaskDTOAttributeMap);
		workTaskDTORecord.setModule("cstIntegration");

		workTaskDTORecord.fillRecordData(tririgaWS, null);



		var responseJSON = {
			"workOrderId": workTaskDTORecord.getRecordData().get("cstWorkTaskIdTX"),
			"externalWorkOrderId": workTaskDTORecord.getRecordData().get("cstExternalWorkOrderIDTX"),
			"code": triResponse.getResponseHelpers()[0].getRecordId(),
			"message": "Work order created successfully"
		};

		saveRequestResponse(triResponse.getResponseHelpers()[0].getRecordId(), requestJSONString,JSON.stringify(responseJSON))

		log.info("Response:" + responseJSON);

		response.setHeader("Content-Type", "application/json");
		response.getWriter().print(JSON.stringify(responseJSON));

	}


	execute();

})();


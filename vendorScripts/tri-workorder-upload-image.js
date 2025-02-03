load("nashorn:mozilla_compat.js");
load(classLoader.getResource("init.js"));

load(classLoader.getResource("tri-workorder-common.js"));


importPackage(org.json);
importPackage(java.io);
importPackage(java.util);

importPackage(com.tririga.ws.dto);
importPackage(com.tririga.ws.dto.content);

importPackage(javax.activation);
importPackage(com.deloitte.tririga.custom.message);
importPackage(org.apache.commons.fileupload);
importPackage(org.apache.commons.fileupload.disk);
importPackage(org.apache.commons.fileupload.servlet);
importPackage(org.apache.commons.io);



(function execute() {

	var log = logger.getDBLogger("vn-tri-workorder-upload-image-js");
	log.info("BEGIN");

	var FileUtils = Java.type("org.apache.commons.io.FileUtils");
	var File = Java.type("java.io.File");

	var contentType = request.getContentType();
	if (contentType == null || !contentType.startsWith("multipart/form-data")) {
		throwError("HTTP request must have Content-Type as 'multipart/form-data'", 400);
		return;
	}

	var requestURI = request.getRequestURI();

	var workOrderId = "";


	var Pattern = Java.type("java.util.regex.Pattern")
	var workOrderIDPattern = Pattern.compile("triWorkOrder/.+/");

	//log.info("workOrderIDPattern-requestURI :" + workOrderIDPattern + "-" + requestURI);


	var m = workOrderIDPattern.matcher(requestURI);

	if (m.find()) {
		workOrderId = requestURI.substring(m.start() + "triWorkOrder/".length(), m.end() - 1);
	} else {
		throwError("Cannot read Work Order ID (workOderId) from the request", 400);
	}

	var LEGACY_MC_MAPPING = getAPIContext().get("LEGACY_MC_MAPPING");
	if (LEGACY_MC_MAPPING == null)
		LEGACY_MC_MAPPING = initLegacyMCMap();


	var temp = LEGACY_MC_MAPPING[workOrderId];
	if (temp != null) {
		log.info(java.lang.String.format("The LegacyID [%s] has WorkOrder ID [%s]", workOrderId, temp));
	}

	var workTaskRecord = new RecordData();

	var attributeSet = new HashSet();
	attributeSet.addAll(["triStatusCL", "triNameTX", "cstExternalWorkOrderIDTX", "cstWorkTaskIdTX", "triModifiedSY", "triRecordIdSY"]);

	var attributeMap = new HashMap();
	attributeMap.put("General", attributeSet);

	workTaskRecord.setRecordID(-1);
	workTaskRecord.setObjectType("cstWorkTaskDTO");
	workTaskRecord.setAttributes(attributeMap);
	workTaskRecord.setModule("cstIntegration");


	if (temp != null) {
		workTaskRecord.fillRecordData(tririgaWS, "General", "cstWorkTaskIdTX", temp);
	} else {
		workTaskRecord.fillRecordData(tririgaWS, "General", "cstWorkTaskIdTX", workOrderId);
	}

	var recordDataMap = workTaskRecord.getRecordData();


	if (recordDataMap.get("cstWorkTaskIdTX") == null) {
		throwError("Could not find Work Order with ID : " + workOrderId, 404);
		return;
	}

	createEventLog("{1} attempted to upload image", workOrderId);


	var triWorkTask = getWorkTask(recordDataMap.get("cstWorkTaskIdTX"));
	log.debug("triWorkTask:" + triWorkTask);

	var validState = ["Active", "Completed"];
	if (validState.indexOf(triWorkTask.get("triStatusCL")) == -1) {
		var errMsg = java.lang.String.format("The Work Order with ID[%s] is not in editable state, current value is [%s]", workOrderId, triWorkTask.get("triStatusCL"));
		throwError(errMsg, 400);
		createEventLog("[{1} - UPLOAD-IMAGE] API_VALIDATION_EXCEPTION:" + errMsg, workOrderId);

		return;
	}

	workTaskRecord.setRecordID(java.lang.Long.parseLong(recordDataMap.get("triRecordIdSY")));

	var items = new ServletFileUpload(new DiskFileItemFactory()).parseRequest(request);

	var desc = "";
	var img = null;
	var imgName = "";

	for (var i = 0; i < items.length; i++) {
		var item = items[i];
		if (item.getFieldName() == "image") {
			img = item.get();
			imgName = item.getName();
			log.debug("File Size : " + item.getSize());
		}

		if (item.getFieldName() == "description") {
			desc = item.getString();
		}
	}

	if (img == null || img.length == 0) {
		var errMsg = "Unable to locate 'image' in the Request";

		throwError(errMsg, 400);
		createEventLog("[{1} - UPLOAD-IMAGE] API_VALIDATION_EXCEPTION:" + errMsg, workOrderId);

		return;
	}

	log.debug("description : " + desc);
	log.debug("fileName : " + imgName);

	recordDataMap.put("cstNotesTX", desc);

	var tmpFile = File.createTempFile("img", ".png");
	FileUtils.writeByteArrayToFile(tmpFile, img);

	var imageDS = new FileDataSource(tmpFile);
	var dataHandler = new DataHandler(imageDS);

	var content = new Content();
	content.setRecordId(recordDataMap.get("triRecordIdSY"));
	content.setContent(dataHandler);
	content.setFieldName("triImageIM");
	content.setFileName(imgName);

	var upload = tririgaWS.upload(content);

	var download = tririgaWS.download(content);
	//log.trace("Download Status: " + download.getStatus())
	workTaskRecord.saveRecordData(tririgaWS, "cstInbUploadImage");

	tmpFile.delete();
	var responseJSON = {
		"workOrderId ": workOrderId,
		"externalWorkOrderId": recordDataMap.get("cstExternalWorkOrderIDTX"),
		"code": "200",
		"message": "Work Order Image Updated Successfully at " + recordDataMap.get("triModifiedSY")
	}


	response.setHeader("Content-Type", "application/json");
	var responseJSONStr = JSON.stringify(responseJSON);
	log.debug("200:" + responseJSONStr);
	response.getWriter().print(responseJSONStr);
})();
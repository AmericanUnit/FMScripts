load("nashorn:mozilla_compat.js");
load(classLoader.getResource("init.js"));

load(classLoader.getResource("tri-workorder-common.js"));


importPackage(org.json);
importPackage(java.io);
importPackage(java.util);
importPackage(java.net);


importPackage(com.tririga.ws.dto);
importPackage(com.deloitte.tririga.custom.message);



(function execute() {

	var validEvent = ["", "Service Order Avoidance"];
	var log = logger.getDBLogger("vn-tri-workorder-log-notes-js");
	log.info("BEGIN");

	var contentType = request.getContentType();
	if(contentType == null || !contentType.startsWith("application/x-www-form-urlencoded")){
		throwError("HTTP request must have Content-Type as 'application/x-www-form-urlencoded'",400);
		return;
	}

	var requestParamMap = buildRequestMap(request,log);

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
	if(temp != null){
		log.info(java.lang.String.format("The LegacyID [%s] has WorkOrder ID [%s]",workOrderId ,temp));
	}


	log.debug("workOrderId ::notes-eventType" + workOrderId + "::-" + notes + "-"+eventType);

	var workTaskRecord = new RecordData();

	var attributeSet = new HashSet();

	attributeSet.addAll(["triStatusCL", "triNameTX", "cstExternalWorkOrderIDTX","cstWorkTaskIdTX", "triModifiedSY","triRecordIdSY"]);

	var attributeMap = new HashMap();

	attributeMap.put("General", attributeSet);

	workTaskRecord.setRecordID(-1);
	workTaskRecord.setObjectType("cstWorkTaskDTO");
	workTaskRecord.setAttributes(attributeMap);
	workTaskRecord.setModule("cstIntegration");


	if(temp != null){
		workTaskRecord.fillRecordData(tririgaWS, "General", "cstWorkTaskIdTX", temp);
	}else{
		workTaskRecord.fillRecordData(tririgaWS, "General", "cstWorkTaskIdTX", workOrderId);
	}

	
	var recordDataMap = workTaskRecord.getRecordData();


	if (recordDataMap.get("cstWorkTaskIdTX") == null) {
		throwError("Could not find Work Order with ID : " + workOrderId, 404);
		return;
	}

	createEventLog("{1} attempted to log notes data:" + requestParamMap, workOrderId);


	var notes = requestParamMap.get("notes");
	if(notes == null || notes.length == 0){
		var errMsg = "'notes' is mandatory key for request and must have valid value";
		throwError(errMsg, 400);
		createEventLog("[{1} - LOG-NOTES] API_VALIDATION_EXCEPTION:" + errMsg, workOrderId);

		return;
	}
	
	var eventType = requestParamMap.get("eventType");
	if(eventType != null && validEvent.indexOf(eventType) == -1){
		var errMsg = "'eventType' must have valid value. Valid values are : " + validEvent.slice(1,validEvent.length);
		throwError(errMsg, 400);
		createEventLog("[{1} - LOG-NOTES] API_VALIDATION_EXCEPTION:" + errMsg, workOrderId);

		return;
	}

	var triWorkTask = getWorkTask(recordDataMap.get("cstWorkTaskIdTX"));
	log.debug("triWorkTask:" + triWorkTask);

	var validState = ["Active","Completed"];
	if(validState.indexOf(triWorkTask.get("triStatusCL")) == -1){

		var errMsg = java.lang.String.format("The Work Order with ID[%s] is not in an editable state, current value is [%s]",workOrderId,triWorkTask.get("triStatusCL"));
		throwError(errMsg, 400);
		createEventLog("[{1} - LOG-NOTES] API_VALIDATION_EXCEPTION:" + errMsg, workOrderId);

		return;
	}

	workTaskRecord.setRecordID(java.lang.Long.parseLong(recordDataMap.get("triRecordIdSY")));
	

	recordDataMap.put("cstNotesTX", notes);
	recordDataMap.put("cstEventLogTypeTX", eventType);

	workTaskRecord.saveRecordData(tririgaWS, "cstInbLogNotes");

	var responseJSON = {
		"workOrderId ": workOrderId,
		"externalWorkOrderId": recordDataMap.get("cstExternalWorkOrderIDTX"),
		"code": "200",
		"message": "Work Order Log Notes Updated Successfully at " +  recordDataMap.get("triModifiedSY")
	}

	response.setHeader("Content-Type", "application/json");

	var responseJSONStr = JSON.stringify(responseJSON);
	log.debug("200:"+responseJSONStr);
	response.getWriter().print(responseJSONStr);

})();
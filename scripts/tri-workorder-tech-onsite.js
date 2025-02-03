load("nashorn:mozilla_compat.js");
load(classLoader.getResource("init.js"));

load(classLoader.getResource("tri-workorder-common.js"));


importPackage(org.json);
importPackage(java.io);
importPackage(java.util);
importPackage(java.net);
importPackage(com.tririga.ws.dto);
importPackage(com.deloitte.tririga.custom.message);
importPackage(java.text);



(function execute() {

	var STANDARD_DATE_FORMAT = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX");
	var log = logger.getDBLogger("vn-tri-workorder-tech-onsite-js");
	log.info("BEGIN");


	var contentType = request.getContentType();
	if(contentType == null || !contentType.startsWith("application/x-www-form-urlencoded")){
		throwError("HTTP Request must have Content-Type as 'application/x-www-form-urlencoded'",400);
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
	if(temp != null){
		log.info(java.lang.String.format("The LegacyID [%s] has WorkOrder ID [%s]",workOrderId ,temp));
	}

	var requestParamMap = buildRequestMap(request,log);
	var comments = requestParamMap.get("comments");
	var requestParamDate = requestParamMap.get("arrivalTimestamp");
	var arrivalTimestamp = null;

	if(requestParamDate != null && requestParamDate.length != 0){
		try {
			var date = STANDARD_DATE_FORMAT.parse(requestParamDate);
			arrivalTimestamp = ""+date.getTime();
		} catch (error) {
			throwError(java.lang.String.format("The arrivalTimestamp [%s] should be in this format[yyyy-MM-dd'T'HH:mm:ssXXX]",requestParamDate), 400);
			return;
		}
	}

	var incomingVZId = getRequestVZId();
	var workTaskRecord = new RecordData();

	var attributeSet = new HashSet();

	attributeSet.addAll(["triStatusCL", "triNameTX", "cstExternalWorkOrderIDTX","cstWorkTaskIdTX", "triModifiedSY","triRecordIdSY","cstVendorIdTX","cstWorkTaskStatusTX"]);


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
	log.info("DTO VZ ID : " + recordDataMap.get("cstVendorIdTX"));
	log.info("Pulled Data : " + recordDataMap)

	var workOrderAvailable = recordDataMap.get("cstWorkTaskIdTX") != null;

	if (workOrderAvailable) {
		createEventLog("{1} attempted to perform tech-onsite data:" + requestParamMap, workOrderId);
	}

	if (!workOrderAvailable || recordDataMap.get("cstVendorIdTX") == null) {
		var errMsg = "Could not find Work Order with ID:" + workOrderId;
		throwError(errMsg, 404);

		if (workOrderAvailable)
			createEventLog("[{1} - TECH-ONSITE] API_VALIDATION_EXCEPTION:" + errMsg, workOrderId);
			
		return;
	}
	
	if(!recordDataMap.get("cstVendorIdTX").equalsIgnoreCase(incomingVZId) || recordDataMap.get("cstWorkTaskStatusTX") == "UNASSIGNED"){
		var errMsg = java.lang.String.format("The Work Order [%s] is no longer assigned",workOrderId);
		throwError(errMsg, 400);
		createEventLog("[{1} - TECH-ONSITE] API_VALIDATION_EXCEPTION:" + errMsg, workOrderId);

		return;
	}

	var triWorkTask = getWorkTask(recordDataMap.get("cstWorkTaskIdTX"));
	log.info("triWorkTask:" + triWorkTask);

	if(triWorkTask.get("triStatusCL") !=  "Active"){
		var errMsg = java.lang.String.format("The Work Order with ID[%s] is not in 'Active' state, current value is [%s]",workOrderId,triWorkTask.get("triStatusCL"));
		throwError(errMsg, 400);
		createEventLog("[{1} - TECH-ONSITE] API_VALIDATION_EXCEPTION:" + errMsg, workOrderId);

		return;
	}

	if(triWorkTask.get("cstResolutionTypeCL") ==  "Technician On Site"){
		var errMsg = java.lang.String.format("The Work Order with ID [%s] already has a Technician on Site",workOrderId);
		throwError(errMsg, 400);
		createEventLog("[{1} - TECH-ONSITE] API_VALIDATION_EXCEPTION:" + errMsg, workOrderId);

		return;
	}

	workTaskRecord.setRecordID(java.lang.Long.parseLong(recordDataMap.get("triRecordIdSY")));
	

	recordDataMap.put("cstNotesTX", comments);
	recordDataMap.put("triAssignedDT",arrivalTimestamp);

	workTaskRecord.saveRecordData(tririgaWS, "cstInbTechOnsite");

	var responseJSON = {
		"workOrderId ": workOrderId,
		"externalWorkOrderId": recordDataMap.get("cstExternalWorkOrderIDTX"),
		"code": "200",
		"message": "Work Order Tech On Site Updated Successfully at " +  recordDataMap.get("triModifiedSY")
	}

	response.setHeader("Content-Type", "application/json");
	var responseJSONStr = JSON.stringify(responseJSON);
	log.info("200:"+responseJSONStr);
	response.getWriter().print(responseJSONStr);
})();
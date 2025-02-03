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
	var log = logger.getDBLogger("vn-tri-workorder-completion-js");
	log.info("BEGIN");


	var contentType = request.getContentType();
	if (contentType == null || !contentType.startsWith("application/x-www-form-urlencoded")) {
		throwError("HTTP Request must have Content-Type as 'application/x-www-form-urlencoded'", 400);
		return;
	}

	var validLateCompletionReason = ["Absorbed Work", "Funding Time Line Delay", "Parts Lead Time", "Conversion Default Exception, Vendor API not ready","API Validation"];
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

	var incomingVZId = getRequestVZId();

	var workTaskRecord = new RecordData();

	var attributeSet = new HashSet();

	attributeSet.addAll(["triStatusCL", "triNameTX", "cstExternalWorkOrderIDTX", "cstWorkTaskIdTX", "triModifiedSY", "triRecordIdSY", "cstFromExternalSystemTX", "cstPriorityClassTX", "cstWorkTaskStatusTX", "cstVendorIdTX", "triPlannedEndDT"]);



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
	log.info("DTO VZ ID : " + recordDataMap.get("cstVendorIdTX"));
	log.info("Custom Data Map : " + recordDataMap)

	var requestParamMap = buildRequestMap(request, log);
	var workOrderAvailable = recordDataMap.get("cstWorkTaskIdTX") != null;

	if (workOrderAvailable) {
		createEventLog("{1} attempted to complete work task with data:" + requestParamMap, workOrderId);
	}
	

	if (!workOrderAvailable || recordDataMap.get("cstVendorIdTX") == null) {
		var errMsg = java.lang.String.format("Could not find Work Task with ID[%s] for Assignee[%s]", workOrderId, incomingVZId);
		throwError(errMsg, 404);

		if (workOrderAvailable)
			createEventLog("[{1} - WORK-COMPLETE] API_VALIDATION_EXCEPTION:" + errMsg, workOrderId);

		return;
	}



	/*
	 * Replaced with incomingVZId check below
	
		var externalWorkOrderId = requestParamMap.get("externalWorkOrderId");
		if (externalWorkOrderId == null || externalWorkOrderId.length == 0) {
			var errMsg = "The 'externalWorkOrderId' is mandatory key for request and must have valid value";
			throwError(errMsg, 400);
			createEventLog("[{1} - WORK-COMPLETE] API_VALIDATION_EXCEPTION:" + errMsg, workOrderId);
			return;
		}
	*/

	if(!recordDataMap.get("cstVendorIdTX").equalsIgnoreCase(incomingVZId) || recordDataMap.get("cstWorkTaskStatusTX") == "UNASSIGNED"){
		var errMsg = java.lang.String.format("The Work Order [%s] is no longer assigned",workOrderId);
		throwError(errMsg, 400);
		createEventLog("[{1} - WORK-COMPLETE] API_VALIDATION_EXCEPTION:" + errMsg, workOrderId);

		return;
	}	

	var solutionCode = requestParamMap.get("solutionCode");
	var failureCode = requestParamMap.get("failureCode");
	log.info("FailureCode [" + failureCode + "] & SolutionCode [" + solutionCode + "]");
	var codeValidationResp = validateCodes(failureCode, solutionCode);
	//log.info(codeValidationResp);
	if (codeValidationResp.length > 0) {
		throwError(codeValidationResp, 400);
		createEventLog("[{1} - WORK-COMPLETE] API_VALIDATION_EXCEPTION:" + codeValidationResp, workOrderId);

		return;
	}

	var notes = requestParamMap.get("notes");
	if (notes == null || notes.length == 0) {
		var errMsg = "The 'notes' is mandatory key for request and must have valid value";
		throwError(errMsg, 400);
		createEventLog("[{1} - WORK-COMPLETE] API_VALIDATION_EXCEPTION:" + errMsg, workOrderId);
		return;
	}

	var requestParamDate = requestParamMap.get("completionTimestamp");
	var completionTimestamp = null;

	if (requestParamDate != null && requestParamDate.length != 0) {
		try {
			var date = STANDARD_DATE_FORMAT.parse(requestParamDate);
			completionTimestamp = "" + date.getTime();
		} catch (error) {
			var errMsg = java.lang.String.format("The completionTimestamp [%s] should be in this format[yyyy-MM-dd'T'HH:mm:ssXXX]", requestParamDate);

			throwError(errMsg, 400);
			createEventLog("[{1} - WORK-COMPLETE] API_VALIDATION_EXCEPTION:" + errMsg, workOrderId);

			return;
		}
	}




	/*
		cstFromExternalSystemTX will never be "TRUE" , it was just part of throw-away integrtion.
		Hence code FLow will always move inside the "if" condition.
	*/

	/*
	 * Replaced with incomingVZId check below	
		if (recordDataMap.get("cstFromExternalSystemTX") != "TRUE") {

			if (recordDataMap.get("cstExternalWorkOrderIDTX") != externalWorkOrderId) {
				var errMsg = java.lang.String.format(
					"Could not find Work Order with ID[%s] with source ID[%s]. Possibly unassigned",
					workOrderId, externalWorkOrderId);

				throwError(errMsg, 400);
				createEventLog("[{1} - WORK-COMPLETE] API_VALIDATION_EXCEPTION:" + errMsg, workOrderId);
				return;
			}
		}
	 *
	 */



	var plannedEndDate = java.lang.Long.parseLong(recordDataMap.get("triPlannedEndDT"));

	log.info("Validate LateCompletionReason need : " + (System.currentTimeMillis() > plannedEndDate))

	if (System.currentTimeMillis() > plannedEndDate) {

		var lateCompletionReason = requestParamMap.get("lateCompletionReason");
		log.info("LateCompletionReason : " + lateCompletionReason);

		if (validLateCompletionReason.indexOf(lateCompletionReason) == -1) {
			var errMsg = "The plannedEndDate is breached hence 'lateCompletionReason' is mandatory key for request and must have valid value [" + validLateCompletionReason + "]";

			throwError(errMsg, 400);
			createEventLog("[{1} - WORK-COMPLETE] API_VALIDATION_EXCEPTION:" + errMsg, workOrderId);
			return;
		} else {
			recordDataMap.put("cstLateCompletionLI", lateCompletionReason);
		}

	} else {
		recordDataMap.put("cstLateCompletionLI", "");
	}

	/*if (recordDataMap.get("cstWorkTaskIdTX") == null || 
		(recordDataMap.get("cstExternalWorkOrderIDTX") != externalWorkOrderId) ) {
		throwError(java.lang.String.format(
			"Could not find workder order with ID[%s] with source ID[%s]",
			 workOrderId,externalWorkOrderId), 404);
		return;
	}*/

	var triWorkTask = getWorkTask(recordDataMap.get("cstWorkTaskIdTX"));
	log.info("triWorkTask:" + triWorkTask);

	if (triWorkTask.get("triStatusCL") != "Active") {

		var errMsg = java.lang.String.format("The Work Order with ID[%s] is not in 'Active' state, current value is [%s]", workOrderId, triWorkTask.get("triStatusCL"))
		throwError(errMsg, 400);

		createEventLog("[{1} - WORK-COMPLETE] API_VALIDATION_EXCEPTION:" + errMsg, workOrderId);

		return;
	}

	if (recordDataMap.get("cstPriorityClassTX") == "P1" && (triWorkTask.get("cstResolutionTypeCL") != "Technician On Site" && triWorkTask.get("cstResolutionTypeCL") != "Problem Stabilized" && triWorkTask.get("cstResolutionTypeCL") != "Failed Pending Validation")) {
		var errMsg = java.lang.String.format("The Work Order with ID[%s] cannot be Completed because Resolution Status is not one of Technician On Site/ Problem Stabilized / Failed Pending Validation", workOrderId);

		throwError(errMsg, 400);
		createEventLog("[{1} - WORK-COMPLETE] API_VALIDATION_EXCEPTION:" + errMsg, workOrderId);
		return;
	}

	workTaskRecord.setRecordID(java.lang.Long.parseLong(recordDataMap.get("triRecordIdSY")));

	recordDataMap.put("cstSolutionCodeTX", solutionCode);
	recordDataMap.put("cstFailureCodeTX", failureCode);
	recordDataMap.put("cstNotesTX", notes);
	recordDataMap.put("cstCompletedTimeDT", completionTimestamp);


	workTaskRecord.saveRecordData(tririgaWS, "cstInbWorkOrderCompletion");

	var responseJSON = {
		"workOrderId ": workOrderId,
		"externalWorkOrderId": recordDataMap.get("cstExternalWorkOrderIDTX"),
		"code": "200",
		"message": "Work Order Completed Successfully at " + recordDataMap.get("triModifiedSY")
	}

	response.setHeader("Content-Type", "application/json");
	var responseJSONStr = JSON.stringify(responseJSON);
	log.info("200:" + responseJSONStr);
	response.getWriter().print(responseJSONStr);
})();

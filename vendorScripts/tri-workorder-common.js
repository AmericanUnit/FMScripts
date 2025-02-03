//Common JS functions

importPackage("java.lang");
importPackage("com.tririga.design.smartobjecttype.dataaccess");

var log = logger.getDBLogger("vn-tri-workorder-common-js");

var validCompletionCodes = { "Camera Adjustments Bad": ["Security / Adjusted CCTV Camera","Security / Replaced CCTV Camera","Security / Rebooted CCTV Camera", "Approved / Issued", "Assigned Violation To Vendor", "Cleaned Equipment", "No Trouble Found", "Paid Violation Fine", "Power Hit", "Processed Payment", "Security / Ajusted CCTV NVR Settings","Security / Rebooted CCTV NVR","Security / Repaired Shutter","Security / Rebooted Card Access System","Security / Repaired Alarm System or Hardware","Security / Repaired Card Access System", "Referred To EUS", "Refuted Violation", "Reloaded Software", "Repaired Device", "Repaired Equipment", "Repaired Panel", "Replaced Batteries", "Replaced Device", "Replaced Equipment", "Reported To IT", "Reset Equipment", "Reset Power Feed", "Security / Replaced Card Reader", "Security / No Issue Found or Assessed","Security / Resolved Issue Remotely"], "Violation": ["Security / Adjusted CCTV Camera","Security / Replaced CCTV Camera","Security / Rebooted CCTV Camera", "Approved / Issued", "Assigned Violation To Vendor", "Cleaned Equipment", "No Trouble Found", "Paid Violation Fine", "Power Hit", "Processed Payment", "Security / Ajusted CCTV NVR Settings","Security / Rebooted CCTV NVR","Security / Repaired Shutter","Security / Rebooted Card Access System","Security / Repaired Alarm System or Hardware","Security / Repaired Card Access System", "Referred To EUS", "Refuted Violation", "Reloaded Software", "Repaired Device", "Repaired Equipment", "Repaired Panel", "Replaced Batteries", "Replaced Device", "Replaced Equipment", "Reported To IT", "Reset Equipment", "Reset Power Feed", "Security / Replaced Card Reader", "Security / No Issue Found or Assessed","Security / Resolved Issue Remotely"], "Switch / Router Issue": ["Security / Adjusted CCTV Camera","Security / Replaced CCTV Camera","Security / Rebooted CCTV Camera", "Approved / Issued", "Assigned Violation To Vendor", "Cleaned Equipment", "No Trouble Found", "Paid Violation Fine", "Power Hit", "Processed Payment", "Security / Ajusted CCTV NVR Settings","Security / Rebooted CCTV NVR","Security / Repaired Shutter","Security / Rebooted Card Access System","Security / Repaired Alarm System or Hardware","Security / Repaired Card Access System", "Referred To EUS", "Refuted Violation", "Reloaded Software", "Repaired Device", "Repaired Equipment", "Repaired Panel", "Replaced Batteries", "Replaced Device", "Replaced Equipment", "Reported To IT", "Reset Equipment", "Reset Power Feed", "Security / Replaced Card Reader", "Security / No Issue Found or Assessed","Security / Resolved Issue Remotely"], "Reader Failure": ["Security / Adjusted CCTV Camera","Security / Replaced CCTV Camera","Security / Rebooted CCTV Camera", "Approved / Issued", "Assigned Violation To Vendor", "Cleaned Equipment", "No Trouble Found", "Paid Violation Fine", "Power Hit", "Processed Payment", "Security / Ajusted CCTV NVR Settings","Security / Rebooted CCTV NVR","Security / Repaired Shutter","Security / Rebooted Card Access System","Security / Repaired Alarm System or Hardware","Security / Repaired Card Access System", "Referred To EUS", "Refuted Violation", "Reloaded Software", "Repaired Device", "Repaired Equipment", "Repaired Panel", "Replaced Batteries", "Replaced Device", "Replaced Equipment", "Reported To IT", "Reset Equipment", "Reset Power Feed", "Security / Replaced Card Reader", "Security / No Issue Found or Assessed","Security / Resolved Issue Remotely"], "Camera Failure": ["Security / Adjusted CCTV Camera","Security / Replaced CCTV Camera","Security / Rebooted CCTV Camera", "Approved / Issued", "Assigned Violation To Vendor", "Cleaned Equipment", "No Trouble Found", "Paid Violation Fine", "Power Hit", "Processed Payment", "Security / Ajusted CCTV NVR Settings","Security / Rebooted CCTV NVR","Security / Repaired Shutter","Security / Rebooted Card Access System","Security / Repaired Alarm System or Hardware","Security / Repaired Card Access System", "Referred To EUS", "Refuted Violation", "Reloaded Software", "Repaired Device", "Repaired Equipment", "Repaired Panel", "Replaced Batteries", "Replaced Device", "Replaced Equipment", "Reported To IT", "Reset Equipment", "Reset Power Feed", "Security / Replaced Card Reader", "Security / No Issue Found or Assessed","Security / Resolved Issue Remotely"], "Total Unit Failure": ["Security / Adjusted CCTV Camera","Security / Replaced CCTV Camera","Security / Rebooted CCTV Camera", "Approved / Issued", "Assigned Violation To Vendor", "Cleaned Equipment", "No Trouble Found", "Paid Violation Fine", "Power Hit", "Processed Payment", "Security / Ajusted CCTV NVR Settings","Security / Rebooted CCTV NVR","Security / Repaired Shutter","Security / Rebooted Card Access System","Security / Repaired Alarm System or Hardware","Security / Repaired Card Access System", "Referred To EUS", "Refuted Violation", "Reloaded Software", "Repaired Device", "Repaired Equipment", "Repaired Panel", "Replaced Batteries", "Replaced Device", "Replaced Equipment", "Reported To IT", "Reset Equipment", "Reset Power Feed", "Security / Replaced Card Reader", "Security / No Issue Found or Assessed","Security / Resolved Issue Remotely"], "Standard Wear And Tear": ["Absorbed", "Repaired Item", "Replaced Item", "Replaced Parts"], "Alarm Code Activate": ["Security / Adjusted CCTV Camera","Security / Replaced CCTV Camera","Security / Rebooted CCTV Camera", "Approved / Issued", "Assigned Violation To Vendor", "Cleaned Equipment", "No Trouble Found", "Paid Violation Fine", "Power Hit", "Processed Payment", "Security / Ajusted CCTV NVR Settings","Security / Rebooted CCTV NVR","Security / Repaired Shutter","Security / Rebooted Card Access System","Security / Repaired Alarm System or Hardware","Security / Repaired Card Access System", "Referred To EUS", "Refuted Violation", "Reloaded Software", "Repaired Device", "Repaired Equipment", "Repaired Panel", "Replaced Batteries", "Replaced Device", "Replaced Equipment", "Reported To IT", "Reset Equipment", "Reset Power Feed", "Security / Replaced Card Reader", "Security / No Issue Found or Assessed","Security / Resolved Issue Remotely"], "Renewal": ["Security / Adjusted CCTV Camera","Security / Replaced CCTV Camera","Security / Rebooted CCTV Camera", "Approved / Issued", "Assigned Violation To Vendor", "Cleaned Equipment", "No Trouble Found", "Paid Violation Fine", "Power Hit", "Processed Payment", "Security / Ajusted CCTV NVR Settings","Security / Rebooted CCTV NVR","Security / Repaired Shutter","Security / Rebooted Card Access System","Security / Repaired Alarm System or Hardware","Security / Repaired Card Access System", "Referred To EUS", "Refuted Violation", "Reloaded Software", "Repaired Device", "Repaired Equipment", "Repaired Panel", "Replaced Batteries", "Replaced Device", "Replaced Equipment", "Reported To IT", "Reset Equipment", "Reset Power Feed", "Security / Replaced Card Reader", "Security / No Issue Found or Assessed","Security / Resolved Issue Remotely"], "Board Failure": ["Security / Adjusted CCTV Camera","Security / Replaced CCTV Camera","Security / Rebooted CCTV Camera", "Approved / Issued", "Assigned Violation To Vendor", "Cleaned Equipment", "No Trouble Found", "Paid Violation Fine", "Power Hit", "Processed Payment", "Security / Ajusted CCTV NVR Settings","Security / Rebooted CCTV NVR","Security / Repaired Shutter","Security / Rebooted Card Access System","Security / Repaired Alarm System or Hardware","Security / Repaired Card Access System", "Referred To EUS", "Refuted Violation", "Reloaded Software", "Repaired Device", "Repaired Equipment", "Repaired Panel", "Replaced Batteries", "Replaced Device", "Replaced Equipment", "Reported To IT", "Reset Equipment", "Reset Power Feed", "Security / Replaced Card Reader", "Security / No Issue Found or Assessed","Security / Resolved Issue Remotely"], "Administrative": ["Absorbed", "Training"], "Preventive Maintenance": ["Absorbed", "PM Complete", "PM Complete Deferred Incorrect Assignment", "PM Complete Deferred Incorrect Frequency", "PM Complete Deferred Incorrect Schedule", "PM Not Complete - Equipment Out Of Season", "PM Not Complete - Incliemnt Weather (I.E. Snow)", "PM Not Complete - Manpower Issues", "PM Not Complete - Out Of Time", "PM Not Complete - P1 Call Out", "PM Not Complete - Vendor Failed To Complete", "PM Not Complete Deferred Invalid Equipment","No Repair Required","PM Not Required - Completed on Corrective","PM Not Required - Equipment Replaced"], "Panic Button Failure": ["Security / Adjusted CCTV Camera","Security / Replaced CCTV Camera","Security / Rebooted CCTV Camera", "Approved / Issued", "Assigned Violation To Vendor", "Cleaned Equipment", "No Trouble Found", "Paid Violation Fine", "Power Hit", "Processed Payment", "Security / Ajusted CCTV NVR Settings","Security / Rebooted CCTV NVR","Security / Repaired Shutter","Security / Rebooted Card Access System","Security / Repaired Alarm System or Hardware","Security / Repaired Card Access System", "Referred To EUS", "Refuted Violation", "Reloaded Software", "Repaired Device", "Repaired Equipment", "Repaired Panel", "Replaced Batteries", "Replaced Device", "Replaced Equipment", "Reported To IT", "Reset Equipment", "Reset Power Feed", "Security / Replaced Card Reader", "Security / No Issue Found or Assessed","Security / Resolved Issue Remotely"], "Equipment Malfunction": ["Absorbed", "Repaired Item", "Replaced Item", "Replaced Parts"], "Network Card Failure": ["Security / Adjusted CCTV Camera","Security / Replaced CCTV Camera","Security / Rebooted CCTV Camera", "Approved / Issued", "Assigned Violation To Vendor", "Cleaned Equipment", "No Trouble Found", "Paid Violation Fine", "Power Hit", "Processed Payment", "Security / Ajusted CCTV NVR Settings","Security / Rebooted CCTV NVR","Security / Repaired Shutter","Security / Rebooted Card Access System","Security / Repaired Alarm System or Hardware","Security / Repaired Card Access System", "Referred To EUS", "Refuted Violation", "Reloaded Software", "Repaired Device", "Repaired Equipment", "Repaired Panel", "Replaced Batteries", "Replaced Device", "Replaced Equipment", "Reported To IT", "Reset Equipment", "Reset Power Feed", "Security / Replaced Card Reader", "Security / No Issue Found or Assessed","Security / Resolved Issue Remotely"], "Abuse": ["Absorbed", "Security / Adjusted CCTV Camera","Security / Replaced CCTV Camera","Security / Rebooted CCTV Camera", "Adjusted Settings On Equipment", "Approved / Issued", "Assigned Violation To Vendor", "Cleaned Equipment", "No Trouble Found", "Paid Violation Fine", "Power Hit", "Processed Payment", "Security / Ajusted CCTV NVR Settings","Security / Rebooted CCTV NVR","Security / Repaired Shutter","Security / Rebooted Card Access System","Security / Repaired Alarm System or Hardware","Security / Repaired Card Access System", "Referred To EUS", "Refuted Violation", "Reloaded Software", "Repaired Device", "Repaired Equipment", "Repaired Item", "Repaired Panel", "Replaced Batteries", "Replaced Device", "Replaced Equipment", "Replaced Item", "Replaced Parts", "Reported To IT", "Reset Equipment", "Reset Power Feed", "Security / Replaced Card Reader", "Security / No Issue Found or Assessed","Security / Resolved Issue Remotely"], "Door Latch Failure": ["Security / Adjusted CCTV Camera","Security / Replaced CCTV Camera","Security / Rebooted CCTV Camera", "Approved / Issued", "Assigned Violation To Vendor", "Cleaned Equipment", "No Trouble Found", "Paid Violation Fine", "Power Hit", "Processed Payment", "Security / Ajusted CCTV NVR Settings","Security / Rebooted CCTV NVR","Security / Repaired Shutter","Security / Rebooted Card Access System","Security / Repaired Alarm System or Hardware","Security / Repaired Card Access System", "Referred To EUS", "Refuted Violation", "Reloaded Software", "Repaired Device", "Repaired Equipment", "Repaired Panel", "Replaced Batteries", "Replaced Device", "Replaced Equipment", "Reported To IT", "Reset Equipment", "Reset Power Feed", "Security / Replaced Card Reader", "Security / No Issue Found or Assessed","Security / Resolved Issue Remotely"], "BVI System (IT Managed)": ["Security / Adjusted CCTV Camera","Security / Replaced CCTV Camera","Security / Rebooted CCTV Camera", "Approved / Issued", "Assigned Violation To Vendor", "Cleaned Equipment", "No Trouble Found", "Paid Violation Fine", "Power Hit", "Processed Payment", "Security / Ajusted CCTV NVR Settings","Security / Rebooted CCTV NVR","Security / Repaired Shutter","Security / Rebooted Card Access System","Security / Repaired Alarm System or Hardware","Security / Repaired Card Access System", "Referred To EUS", "Refuted Violation", "Reloaded Software", "Repaired Device", "Repaired Equipment", "Repaired Panel", "Replaced Batteries", "Replaced Device", "Replaced Equipment", "Reported To IT", "Reset Equipment", "Reset Power Feed", "Security / Replaced Card Reader", "Security / No Issue Found or Assessed","Security / Resolved Issue Remotely"], "Electrical Failure": ["Absorbed", "Security / Adjusted CCTV Camera","Security / Replaced CCTV Camera","Security / Rebooted CCTV Camera", "Adjusted Settings On Equipment", "Approved / Issued", "Assigned Violation To Vendor", "Cleaned Equipment", "No Trouble Found", "Paid Violation Fine", "Power Hit", "Processed Payment", "Security / Ajusted CCTV NVR Settings","Security / Rebooted CCTV NVR","Security / Repaired Shutter","Security / Rebooted Card Access System","Security / Repaired Alarm System or Hardware","Security / Repaired Card Access System", "Referred To EUS", "Refuted Violation", "Reloaded Software", "Repaired Device", "Repaired Equipment", "Repaired Item", "Repaired Panel", "Replaced Batteries", "Replaced Device", "Replaced Equipment", "Replaced Item", "Replaced Parts", "Reported To IT", "Reset Equipment", "Reset Power Feed", "Security / Replaced Card Reader", "Security / No Issue Found or Assessed","Security / Resolved Issue Remotely"], "Retail Assessment": ["Retail Assessment"], "User Error": ["Security / Adjusted CCTV Camera","Security / Replaced CCTV Camera","Security / Rebooted CCTV Camera", "Approved / Issued", "Assigned Violation To Vendor", "Cleaned Equipment", "No Trouble Found", "Paid Violation Fine", "Power Hit", "Processed Payment", "Security / Ajusted CCTV NVR Settings","Security / Rebooted CCTV NVR","Security / Repaired Shutter","Security / Rebooted Card Access System","Security / Repaired Alarm System or Hardware","Security / Repaired Card Access System", "Referred To EUS", "Refuted Violation", "Reloaded Software", "Repaired Device", "Repaired Equipment", "Repaired Panel", "Replaced Batteries", "Replaced Device", "Replaced Equipment", "Reported To IT", "Reset Equipment", "Reset Power Feed", "Security / Replaced Card Reader", "Security / No Issue Found or Assessed","Security / Resolved Issue Remotely"], "Hard Drive Failure": ["Security / Adjusted CCTV Camera","Security / Replaced CCTV Camera","Security / Rebooted CCTV Camera", "Approved / Issued", "Assigned Violation To Vendor", "Cleaned Equipment", "No Trouble Found", "Paid Violation Fine", "Power Hit", "Processed Payment", "Security / Ajusted CCTV NVR Settings","Security / Rebooted CCTV NVR","Security / Repaired Shutter","Security / Rebooted Card Access System","Security / Repaired Alarm System or Hardware","Security / Repaired Card Access System", "Referred To EUS", "Refuted Violation", "Reloaded Software", "Repaired Device", "Repaired Equipment", "Repaired Panel", "Replaced Batteries", "Replaced Device", "Replaced Equipment", "Reported To IT", "Reset Equipment", "Reset Power Feed", "Security / Replaced Card Reader", "Security / No Issue Found or Assessed","Security / Resolved Issue Remotely"], "Infrastructure Issue": ["Absorbed", "Installation", "Repaired Item", "Replaced Item", "Replaced Parts"], "Network Issue": ["Security / Adjusted CCTV Camera","Security / Replaced CCTV Camera","Security / Rebooted CCTV Camera", "Approved / Issued", "Assigned Violation To Vendor", "Cleaned Equipment", "Network Capacity Issues", "No Trouble Found", "Paid Violation Fine", "Power Hit", "Processed Payment", "Security / Ajusted CCTV NVR Settings","Security / Rebooted CCTV NVR","Security / Repaired Shutter","Security / Rebooted Card Access System","Security / Repaired Alarm System or Hardware","Security / Repaired Card Access System", "Referred To EUS", "Refuted Violation", "Reloaded Software", "Repaired Device", "Repaired Equipment", "Repaired Panel", "Replaced Batteries", "Replaced Device", "Replaced Equipment", "Reported To IT", "Reset Equipment", "Reset Power Feed", "Security / Replaced Card Reader", "Security / No Issue Found or Assessed","Security / Resolved Issue Remotely"], "Defective Part": ["Absorbed", "Security / Adjusted CCTV Camera","Security / Replaced CCTV Camera","Security / Rebooted CCTV Camera", "Approved / Issued", "Assigned Violation To Vendor", "Cleaned Equipment", "No Trouble Found", "Paid Violation Fine", "Power Hit", "Processed Payment", "Security / Ajusted CCTV NVR Settings","Security / Rebooted CCTV NVR","Security / Repaired Shutter","Security / Rebooted Card Access System","Security / Repaired Alarm System or Hardware","Security / Repaired Card Access System", "Referred To EUS", "Refuted Violation", "Reloaded Software", "Repaired Device", "Repaired Equipment", "Repaired Panel", "Replaced Batteries", "Replaced Device", "Replaced Equipment", "Reported To IT", "Reset Equipment", "Reset Power Feed", "Security / Replaced Card Reader", "Security / No Issue Found or Assessed","Security / Resolved Issue Remotely"], "Motion Detection Failure": ["Security / Adjusted CCTV Camera","Security / Replaced CCTV Camera","Security / Rebooted CCTV Camera", "Approved / Issued", "Assigned Violation To Vendor", "Cleaned Equipment", "No Trouble Found", "Paid Violation Fine", "Power Hit", "Processed Payment", "Security / Ajusted CCTV NVR Settings","Security / Rebooted CCTV NVR","Security / Repaired Shutter","Security / Rebooted Card Access System","Security / Repaired Alarm System or Hardware","Security / Repaired Card Access System", "Referred To EUS", "Refuted Violation", "Reloaded Software", "Repaired Device", "Repaired Equipment", "Repaired Panel", "Replaced Batteries", "Replaced Device", "Replaced Equipment", "Reported To IT", "Reset Equipment", "Reset Power Feed", "Security / Replaced Card Reader", "Security / No Issue Found or Assessed","Security / Resolved Issue Remotely"], "Camera Mountings": ["Security / Adjusted CCTV Camera","Security / Replaced CCTV Camera","Security / Rebooted CCTV Camera", "Approved / Issued", "Assigned Violation To Vendor", "Cleaned Equipment", "No Trouble Found", "Paid Violation Fine", "Power Hit", "Processed Payment", "Security / Ajusted CCTV NVR Settings","Security / Rebooted CCTV NVR","Security / Repaired Shutter","Security / Rebooted Card Access System","Security / Repaired Alarm System or Hardware","Security / Repaired Card Access System", "Referred To EUS", "Refuted Violation", "Reloaded Software", "Repaired Device", "Repaired Equipment", "Repaired Panel", "Replaced Batteries", "Replaced Device", "Replaced Equipment", "Reported To IT", "Reset Equipment", "Reset Power Feed", "Security / Replaced Card Reader", "Security / No Issue Found or Assessed","Security / Resolved Issue Remotely"], "Service Call Avoided": ["Absorbed", "Adjusted Settings On Equipment", "Installation", "PM Complete", "Project Support", "Repaired Item", "Replaced Item", "Replaced Parts"], "Store Biography": ["Store Biography"], "Power Failure": ["Security / Adjusted CCTV Camera","Security / Replaced CCTV Camera","Security / Rebooted CCTV Camera", "Approved / Issued", "Assigned Violation To Vendor", "Cleaned Equipment", "No Trouble Found", "Paid Violation Fine", "Power Hit", "Processed Payment", "Security / Ajusted CCTV NVR Settings","Security / Rebooted CCTV NVR","Security / Repaired Shutter","Security / Rebooted Card Access System","Security / Repaired Alarm System or Hardware","Security / Repaired Card Access System", "Referred To EUS", "Refuted Violation", "Reloaded Software", "Repaired Device", "Repaired Equipment", "Repaired Panel", "Replaced Batteries", "Replaced Device", "Replaced Equipment", "Reported To IT", "Reset Equipment", "Reset Power Feed", "Security / Replaced Card Reader", "Security / No Issue Found or Assessed","Security / Resolved Issue Remotely"], "Network Software Issue": ["Security / Adjusted CCTV Camera","Security / Replaced CCTV Camera","Security / Rebooted CCTV Camera", "Approved / Issued", "Assigned Violation To Vendor", "Cleaned Equipment", "No Trouble Found", "Paid Violation Fine", "Power Hit", "Processed Payment", "Security / Ajusted CCTV NVR Settings","Security / Rebooted CCTV NVR","Security / Repaired Shutter","Security / Rebooted Card Access System","Security / Repaired Alarm System or Hardware","Security / Repaired Card Access System", "Referred To EUS", "Refuted Violation", "Reloaded Software", "Repaired Device", "Repaired Equipment", "Repaired Panel", "Replaced Batteries", "Replaced Device", "Replaced Equipment", "Reported To IT", "Reset Equipment", "Reset Power Feed", "Security / Replaced Card Reader", "Security / No Issue Found or Assessed","Security / Resolved Issue Remotely"], "Vandalism": ["Absorbed", "Repaired Item", "Replaced Item", "Replaced Parts"], "Project Work": ["Absorbed", "Installation", "Project Support", "Repaired Item", "Replaced Parts"] };

function throwError(message, status) {

	response.setHeader("Content-Type", "application/json");
	response.setStatus(status);

	var errResponse = {
		"errorCode": 0,
		"errorType": "FATAL",
		"errorMessage": message
	}
	var errString = JSON.stringify(errResponse);

	log.info(status + ":" + errString);

	response.getWriter().print(errString);
}

function createEventLog(comments, cstWorkTaskIdTX) {

	var integrationRecordArray = [];
	var integrationFieldArray = [];
	var integrationRecord = new IntegrationRecord();

	integrationRecord.setModuleId(tririgaWS.getModuleId("triCommon"));
	integrationRecord.setObjectTypeId(tririgaWS.getObjectTypeId("triCommon", "cstEventLog"));

	var integrationSection = new IntegrationSection();
	integrationSection.setName("RecordInformation");

	var guis = tririgaWS.getGUIsByName("cstEventLog", "triCommon");

	var cstEventLogGUIID = "";

	for (var i = 0; i < guis.length; i++) {
		if (guis[i].getName().equals("cstEventLog")) {
			cstEventLogGUIID = guis[i].getId();
			integrationRecord.setGuiId(guis[i].getId());;
			break;
		}
	};

	integrationRecord.setObjectTypeName("cstEventLog");
	integrationRecord.setId(-1);
	integrationRecord.setActionName("triCreate");

	var integrationField = new IntegrationField();
	integrationField.setName("triCreatedDateTimeDT");
	integrationField.setValue(System.currentTimeMillis());
	integrationFieldArray.push(integrationField);

	integrationField = new IntegrationField();
	integrationField.setName("triCommentTX");
	integrationField.setValue(comments);
	integrationFieldArray.push(integrationField);

	integrationField = new IntegrationField();
	integrationField.setName("cstLinkedRecordIDTX");
	integrationField.setValue(cstWorkTaskIdTX);
	integrationFieldArray.push(integrationField);

	integrationSection.setFields(integrationFieldArray);

	var intSectionArray = [integrationSection];
	integrationRecord.setSections(intSectionArray);
	integrationRecordArray.push(integrationRecord);

	var triResponse = tririgaWS.saveRecord(integrationRecordArray)

	log.info("Record getModuleId:" + integrationRecord.getModuleId());
	log.info("Record getObjectTypeId:" + integrationRecord.getObjectTypeId());
	log.info("Record getGuiId:" + integrationRecord.getGuiId());

	log.info("triResponse:" + triResponse.getResponseHelpers());
	log.info("triResponse.getRecordId:" + triResponse.getResponseHelpers()[0].getRecordId());


	var triggerActionArray = [];
	var triggerActions = new com.tririga.ws.dto.TriggerActions();

	triggerActions.setRecordId(triResponse.getResponseHelpers()[0].getRecordId());
	triggerActions.setActionName("cstAssociateRecord");
	

	triggerActionArray.push(triggerActions);


	var triResponse = tririgaWS.triggerActions(triggerActionArray);

	return triResponse;

}

function getWorkTask(id) {

	try {
		log.trace("ID for lookup : " + id);
		var initialTS = System.currentTimeMillis();
		log.trace("TS : " + initialTS);

		var rd = new RecordData();

		var as = new HashSet();

		as.addAll(["triStatusCL", "triIdTX", "triNameTX", "cstResolutionTypeCL"]);

		var am = new HashMap();

		am.put("RecordInformation", as);

		rd.setRecordID(-1);
		rd.setObjectType("triWorkTask");
		rd.setAttributes(am);
		rd.setModule("triTask");

		rd.fillRecordData(tririgaWS, "RecordInformation", "triIdTX", id);

		var totalTimeToFetch = System.currentTimeMillis() - initialTS;

		log.trace("Time to get Data in ms : " + totalTimeToFetch);
	} catch (error) {
		log.error("Exception : " + error)
	}
	return rd.getRecordData();
}


function buildRequestMap(servletRequest, log) {


	var inputStream = servletRequest.getInputStream();
	var byteArr = Array(servletRequest.getContentLength());


	byteArr = Java.to(byteArr, "byte[]");
	//Start reading XML Request as a Stream of Bytes

	var bis = new BufferedInputStream(inputStream);

	bis.read(byteArr, 0, byteArr.length);

	var requestData = "";

	if (servletRequest.getCharacterEncoding() != null) {
		requestData = new java.lang.String(byteArr, servletRequest.getCharacterEncoding());
	} else {
		requestData = new java.lang.String(byteArr);
	}

	bis.close();
	log.info("requestData:" + requestData);


	var requestParamMap = new LinkedHashMap();
	var pairs = requestData.split("&");
	for (var i = 0; i < pairs.length; i++) {
		var pair = pairs[i];
		var idx = pair.indexOf("=");
		requestParamMap.put(URLDecoder.decode(pair.substring(0, idx), "UTF-8"), URLDecoder.decode(pair.substring(idx + 1), "UTF-8"));
	}

	//log.info("requestParamMap:" + requestParamMap);

	return requestParamMap;

}

function fetchRecordData(module, bo, section, fields, recordId) {

	if (recordId == null || recordId.length() == 0)
		return new HashMap();

	try {
		log.trace("recordId for lookup : " + recordId);
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

		log.trace("Time to get Data in ms : " + totalTimeToFetch);
		return rd.getRecordData();
	} catch (error) {
		log.error("Exception : " + error)
		return new HashMap();
	}


}

function executeSqlQuery(query, fields) {

	var sqlConn = DBConnectionDAO.getConnection();
	var preparedStatement = sqlConn.prepareStatement(query);
	var resultSet = preparedStatement.executeQuery();

	var resultData = [];

	while (resultSet.next()) {

		var result = new HashMap();

		fields.forEach((function (val) {
			result.put(val, resultSet.getString(val))
		}));

		resultData.push(result);
	}
	DBConnectionDAO.cleanDB(resultSet, preparedStatement, null, sqlConn, null)
	log.trace("Sql Query Result : " + resultData);

	return resultData;
}

function getRequestVZId() {
	try {

		var Decoder = Java.type("java.util.Base64").getDecoder();


		var basicAuthHeader = new java.lang.String(Decoder.decode(request.getHeader("Authorization").substring("Basic ".length())));

		var userId = basicAuthHeader.substring(0, basicAuthHeader.indexOf(':'));

		log.info("Logged In UserID : " + userId);


		var id = USER_ACCOUNT_MAPPING[userId];

		if (id == null)
			return "";

		/*
				var userSession = tririgaWS.getHttpSession();
				log.info("Logged In UserID : " + userSession.getId());
				var query = java.lang.String.format("select * from IBS_SPEC_ASSIGNMENTS where SPEC_ID = %s and ASS_TYPE = '%s' AND ASS_SPEC_CLASS_TYPE = 7 AND ASS_SPEC_TEMPLATE_ID = 106402", userSession.getId(), "Associated To");
				var currentUserProfileRecordId = executeSqlQuery(query, ["ASS_SPEC_ID"]);
				query = java.lang.String.format("select * from T_TRIPEOPLE where spec_id = %s", currentUserProfileRecordId[0].ASS_SPEC_ID);
				var userProfileRecord = executeSqlQuery(query, ["cstVZIDTX"]);
				log.info("Logged in User VZ ID : " + userProfileRecord[0].cstVZIDTX);
		
				var id = userProfileRecord[0].cstVZIDTX;
				if (id == null)
					return "";
		*/

		log.info("Logged in User VZ ID : " + id);

		return id;
	} catch (error) {
		log.error("Error While getting profile VZ ID !! " + error);
		return ""
	}
}

function validateCodes(failCode, soluCode) {

	if (validCompletionCodes[failCode] == null) {
		return "The 'failureCode' is mandatory key for request and must have valid value [" + Object.keys(validCompletionCodes) + "]";
	} else if (validCompletionCodes[failCode].indexOf(soluCode) == -1) {
		return "The 'solutionCode' is mandatory key for request and must have valid value, the valid values for failureCode [" + failCode + "] are [" + validCompletionCodes[failCode] + "]";
	}

	return "";
}

function initLegacyMCMap() {

	try {

		var LEGACY_MC_MAPPING = JSON.parse(com.deloitte.tririga.common.FMUtil.getResourceAsText("legacy-mc-map.json"));
		getAPIContext().put("LEGACY_MC_MAPPING", LEGACY_MC_MAPPING);
		log.info("Legacy - MC Mapping was successfully loaded. Record Count - " + Object.keys(LEGACY_MC_MAPPING).length);
		return LEGACY_MC_MAPPING;

	} catch (error) {
		log.error("Unable to load Legacy MC Mapping!!!");
		return null;
	}

}


//Duplicate code from workorder-common.js

function getAPIContext() {

	var apiContext = appContext.get("API_CONTEXT");

	if (apiContext == null) {
		log.info("Initializing API Context")
		var contextMap = new HashMap();
		appContext.put("API_CONTEXT", contextMap);
		apiContext = contextMap;
	}
	return apiContext;
}
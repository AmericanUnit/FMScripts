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

var log = logger.getDBLogger("vn-workorder-common-js");
function init() {

	var API_CONFIG = JSON.parse(com.deloitte.tririga.common.FMUtil.getResourceAsText("api-config.json"));

	getAPIContext().put("API_CONFIG", API_CONFIG);
	log.info("API Config Initialized");
	//log.debug("Initialized API Config with:" + JSON.stringify(API_CONFIG));

	return API_CONFIG;

}

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

function getDataString(params) {

	var result = new StringBuilder();
	var entrySet = params.entrySet().toArray();

	for (var i = 0; i < entrySet.length; i++) {

		result.append(URLEncoder.encode(entrySet[i].getKey(), "UTF-8"));
		result.append("=");

		var value = entrySet[i].getValue();
		value = value == null ? "" : value;

		result.append(URLEncoder.encode(value, "UTF-8"));

		if (i < entrySet.length - 1)
			result.append("&");

	}
	return result.toString();
}

function saveRequestResponse(specID, requestPayload, responsePayload) {


	var FileUtils = Java.type("org.apache.commons.io.FileUtils");
	var File = Java.type("java.io.File");


	var tmpFile = File.createTempFile("requestPayload", ".txt");
	FileUtils.writeByteArrayToFile(tmpFile, requestPayload.getBytes());

	var fileDS = new FileDataSource(tmpFile);
	var dataHandler = new DataHandler(fileDS);

	var content = new Content();
	content.setRecordId(specID);
	content.setContent(dataHandler);
	content.setFieldName("cstRequestBI");
	content.setFileName("requestPayload.txt");

	var upload = tririgaWS.upload(content);
	tmpFile.delete();


	tmpFile = File.createTempFile("responsePayload", ".txt");
	FileUtils.writeByteArrayToFile(tmpFile, responsePayload.getBytes());

	var fileDS = new FileDataSource(tmpFile);
	var dataHandler = new DataHandler(fileDS);

	var content = new Content();
	content.setRecordId(specID);
	content.setContent(dataHandler);
	content.setFieldName("cstResponseBI");
	content.setFileName("responsePayload.txt");

	var upload = tririgaWS.upload(content);
	tmpFile.delete();
}

function readBinaryContent(specId, fieldName) {
	var content = new Content();
	content.setRecordId(specId);
	content.setFieldName(fieldName);
	var resp = tririgaWS.download(content);
	var dataHandler = resp.getContent();
	var baos = new ByteArrayOutputStream();
	dataHandler.writeTo(baos);
	var output = baos.toString();
	//log.debug(output);
	return output;
}

function getContent(specID, contentFieldName) {


	var tmpFile = File.createTempFile("imgUpload", ".tmp");

	var fileDS = new FileDataSource(tmpFile);
	var dataHandler = new DataHandler(fileDS);

	var content = new Content();
	content.setRecordId(specID);
	content.setContent(dataHandler);
	content.setFieldName("triImageIM");
	content.setFileName(tmpFile.getName());

	return tririgaWS.download(content);
}

function getOauthToken(vendorCode, apiConfig) {

	try {

		var oauthRecord = new RecordData();

		var oauthAttributeSet = new HashSet();

		oauthAttributeSet.addAll(["cstAuthTokenTX", "cstDurationDU", "cstLastExecutedDT", "cstVendorCodeTX", "cstTokenTypeTX", "triRecordIdSY"]);

		var oauthAttributeMap = new HashMap();

		oauthAttributeMap.put("General", oauthAttributeSet);

		oauthRecord.setRecordID(-1);
		oauthRecord.setObjectType("cstOAuthServiceToken");
		oauthRecord.setAttributes(oauthAttributeMap);
		oauthRecord.setModule("cstIntegration");

		oauthRecord.fillRecordData(tririgaWS, "General", "cstVendorCodeTX", vendorCode);

		log.trace("Oauth Record Data Map : " + oauthRecord.getRecordData());

		var token = oauthRecord.getRecordData().getOrDefault("cstAuthTokenTX", "");
		var tokenType = oauthRecord.getRecordData().getOrDefault("cstTokenTypeTX", "");


		var lastFetched = getNSLongValue(oauthRecord.getRecordData().get("cstLastExecutedDT")) * 1000;
		var expiryTime = getNSLongValue(oauthRecord.getRecordData().get("cstDurationDU")) * 1000;

		if (token == "" || tokenType == "" || lastFetched == 0 || lastFetched + expiryTime > System.currentTimeMillis()) {
			/*
				This means token is already Expired or Token doesn't exist or Modified Date doesn't exist
				We need to Generate new Token
			*/

			log.trace("New Token will be Generated for Vendor : " + vendorCode);
			tokenPayload = generateOauthToken(apiConfig[vendorCode]);

			//This means its valid case
			if (tokenPayload.access_token != null && tokenPayload.access_token != "") {
				if (false && tokenPayload.token_type != null && tokenPayload.token_type != "" && tokenPayload.expires_in != null && tokenPayload.expires_in != "") {
					log.debug("Proceeding to Save");
					oauthRecord.setRecordID(java.lang.Long.parseLong(oauthRecord.getRecordData().get("triRecordIdSY")));
					oauthRecord.getRecordData().put("cstAuthTokenTX", tokenPayload.access_token);
					oauthRecord.getRecordData().put("cstLastExecutedDT", System.currentTimeMillis() + "");
					oauthRecord.getRecordData().put("cstTokenTypeTX", tokenPayload.token_type);
					oauthRecord.getRecordData().put("cstDurationDU", (java.lang.Long.parseLong(tokenPayload.expires_in) * 1000) + "");
					oauthRecord.saveRecordData(tririgaWS, "cstSave");
					log.debug("Saving Access token to Tririga")
				}

				return tokenPayload.token_type + " " + tokenPayload.access_token;
			} else {
				return tokenPayload;
			}
		}

		return tokenType + " " + token;
	} catch (error) {
		log.error("Get Oauth Token faced Error !!! " + error);
		return "";
	}
}

function generateOauthToken(config) {
	try{
	var oauthResponseStringBuffer = new StringBuffer("");

	var vendorOAuthEndpointURL = config.oAuthConfig.url;
	var oAuthRequestPayload = config.oAuthConfig.requestPayload;

	log.trace("Authenticating against:" + vendorOAuthEndpointURL);

		var oAuthUrl = new URL(vendorOAuthEndpointURL);
		var conn = oAuthUrl.openConnection();

		conn.setRequestProperty("Content-Type", "application/json");
		conn.setDoOutput(true);

		var bw = new BufferedWriter(new OutputStreamWriter(conn.getOutputStream()));

		bw.write(JSON.stringify(oAuthRequestPayload));
		bw.close();

		log.trace("Getting Auth RC : " + conn.getResponseCode());
		var is = conn.getInputStream();
		var isr = new InputStreamReader(is);
		var br = new BufferedReader(isr);

		while ((inputLine = br.readLine()) != null) {
			oauthResponseStringBuffer.append(inputLine);
		}
		var accessToken = oauthResponseStringBuffer.toString();
		return JSON.parse(accessToken);
	} catch (error) {
		log.error("Error occurred while authenticating with " + vendorOAuthEndpointURL +"Error:"+error);
		return error + "";
	}
}

function getByteFromInputStream(inputStream) {
	var byteArrayOutputStream = new ByteArrayOutputStream();

	var bucket = Java.to(Array(1024), "byte[]");
	var nReadBytes;

	while ((nReadBytes = inputStream.read(bucket, 0, bucket.length)) != -1) {
		byteArrayOutputStream.write(bucket, 0, nReadBytes);
	}

	return byteArrayOutputStream.toByteArray();
}

function getNSLongValue(val) {
	if (val == null || val == "")
		return java.lang.Long.parseLong(0);
	else
		return java.lang.Long.parseLong(val);
}

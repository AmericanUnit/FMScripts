// Load compatibility script
load("nashorn:mozilla_compat.js");

importPackage(java.lang);
importPackage(java.util);
importPackage(java.text);
importPackage(java.net);
importPackage(java.io);


(function() {

	var log = org.apache.log4j.Logger.getLogger("workorder-post-generate-oauthtoken-js")

	function init() {


		var API_CONFIG = JSON.parse(com.deloitte.tririga.common.FMUtil.getResourceAsText("api-config.json"));

		getAPIContext().put("API_CONFIG", API_CONFIG);

		log.debug("Initialized API Config with:" + JSON.stringify(API_CONFIG));

		return API_CONFIG;

	}

	function execute() {

		var responseStringBuffer = new StringBuffer("")

		var API_CONFIG = getAPIContext().get("API_CONFIG");

		if (API_CONFIG == null) API_CONFIG = init();

		var vendorCode = recordData.getRecordData().get("cstVendorIdTX");

		if (API_CONFIG[vendorCode] == null) {
			log.error("cstVendorIdTX is empty,must be one of [C131256,C120297,C122252]");
			return;
		}



		var vendorOAuthEndpointURL = API_CONFIG[vendorCode].oAuthConfig.url;
		var oAuthRequestPayload = API_CONFIG[vendorCode].oAuthConfig.requestPayload;


		log.debug("Authenticating against:" + vendorOAuthEndpointURL);


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

		log.debug("responseStringBuffer:" + responseStringBuffer);


		var responseJSON = JSON.parse(responseStringBuffer.toString());

		recordData.getRecordData().put("cstAuthTokenTX", responseJSON.access_token);
		recordData.getRecordData().put("cstTokenTypeTX", responseJSON.token_type);

		recordData.saveRecordData(tririgaWS,"cstSave", null);

		
	}

	execute();

})();
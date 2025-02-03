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

importPackage(org.apache.commons.io);
importPackage(org.apache.http.client.entity);
importPackage(org.apache.http.util);
importPackage(org.apache.http.impl.client);
importPackage(org.apache.http.client.methods);
importPackage(org.apache.http.message);
importPackage(org.apache.http.impl.client);

(function () {

    var STANDARD_DATE_FORMAT = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX");
    var log = logger.getDBLogger("vn-vendor-api-health-js");

    function vendorAPIHealth() {

        var responseStringBuffer = new StringBuffer("");
        var conn = null;

        try {

            log.trace("Before Fetching API_CONFIG");

            var API_CONFIG = getAPIContext().get("API_CONFIG");

            if (API_CONFIG == null)
                API_CONFIG = init();


            var vendorCode = recordData.getRecordData().get("cstVendorCodeTX");
            var authToken;
            if(API_CONFIG[vendorCode].oAuthConfig != null){
                authToken = getOauthToken(vendorCode, API_CONFIG);
            }

            var responseCode = -1;

            var apiHealthEndpointUrl = API_CONFIG[vendorCode].apiHealthEndpointUrl;

            var healthURL = new URL(apiHealthEndpointUrl);
            var conn = healthURL.openConnection();
            if(authToken !=null){
                conn.setRequestProperty("Authorization", authToken);
            }

            if(API_CONFIG[vendorCode].httpHeader != null){
                var header = API_CONFIG[vendorCode].httpHeader;
                for (var x in header) {
                    conn.setRequestProperty(x, header[x]);
                }
            }
            conn.setDoOutput(true);

            responseCode = conn.getResponseCode();
            log.debug(responseCode+":"+apiHealthEndpointUrl);
            recordData.getRecordData().put("cstStatusCodeTX", responseCode+ "");

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

        } catch (error) {
            log.error("Unable to Do Health Check Due to Error : " + error);
            recordData.getRecordData().put("cstErrorFlagBL", "true");
        }

        log.trace("Response From External System for Health Check : " + responseStringBuffer.toString() + " || RC - " + responseCode);

        if (responseCode >= 200 && responseCode < 300) {
            recordData.getRecordData().put("cstErrorFlagBL", "false");
        } else {
            recordData.getRecordData().put("cstErrorFlagBL", "true");
        }

        recordData.saveRecordData(tririgaWS, "cstSave");

    }

    vendorAPIHealth();
})();
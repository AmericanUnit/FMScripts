//load(classLoader.getResource("dust/dust-core.js"));


(function () {


    var log = org.apache.log4j.Logger.getLogger("integrations-init-js");

    var API_CONFIG = JSON.parse(com.deloitte.tririga.common.FMUtil.getResourceAsText("api-config.json"));

    getAPIContext().set("API_CONFIG", API_CONFIG);

    log.debug("Initialized API Config with:" + JSON.stringify(API_CONFIG));
}
)();
// Form OnLoad handler: hands formContext to every HTML web resource listed below.
// Register: Function = WebResourceHandshake.onLoad, tick "Pass execution context as first parameter".
// List the Name of each HTML web resource control on the form in WEB_RESOURCE_CONTROLS.

var WebResourceHandshake = (function () {
  "use strict";

  var WEB_RESOURCE_CONTROLS = [
    "WebResource_risksopportunities",
    "WebResource_demographics",
    "WebResource_ltfpprinciples",
    "WebResource_financialimpacts",
    "WebResource_savingsmeasures"
  ];

  function onLoad(executionContext) {
    var formContext = executionContext.getFormContext();

    WEB_RESOURCE_CONTROLS.forEach(function (name) {
      var wrControl = formContext.getControl(name);
      if (!wrControl) return;

      wrControl.getContentWindow().then(function (contentWindow) {
        if (contentWindow && typeof contentWindow.setClientApiContext === "function") {
          contentWindow.setClientApiContext(Xrm, formContext);
        }
      });
    });
  }

  return { onLoad: onLoad };
})();

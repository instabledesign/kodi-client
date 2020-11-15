import KodiRequest from "./KodiRequest";

export default (function () {
    let requestId = 1;
    return options => new KodiRequest(requestId++, options)
})();

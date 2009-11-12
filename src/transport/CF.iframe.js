CF.iframe = {};

/**
 The count of how many frames have been used.  This needs to be incremented each time an iframe is added that uses the IframeUploadComm.js
*/
CF.iframe.frameCount = 0;

/**
 * An event publisher for iframe communication.
 */
CF.iframe.events = CF.EventPublisher();


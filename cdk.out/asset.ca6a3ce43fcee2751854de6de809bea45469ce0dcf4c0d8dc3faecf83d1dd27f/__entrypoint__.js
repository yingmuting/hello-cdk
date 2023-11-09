"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.external = void 0;
const https = require("https");
const url = require("url");
// for unit tests
exports.external = {
    sendHttpRequest: defaultSendHttpRequest,
    log: defaultLog,
    includeStackTraces: true,
    userHandlerIndex: './index',
};
const CREATE_FAILED_PHYSICAL_ID_MARKER = 'AWSCDK::CustomResourceProviderFramework::CREATE_FAILED';
const MISSING_PHYSICAL_ID_MARKER = 'AWSCDK::CustomResourceProviderFramework::MISSING_PHYSICAL_ID';
async function handler(event) {
    exports.external.log(JSON.stringify(event, undefined, 2));
    // ignore DELETE event when the physical resource ID is the marker that
    // indicates that this DELETE is a subsequent DELETE to a failed CREATE
    // operation.
    if (event.RequestType === 'Delete' && event.PhysicalResourceId === CREATE_FAILED_PHYSICAL_ID_MARKER) {
        exports.external.log('ignoring DELETE event caused by a failed CREATE event');
        await submitResponse('SUCCESS', event);
        return;
    }
    try {
        // invoke the user handler. this is intentionally inside the try-catch to
        // ensure that if there is an error it's reported as a failure to
        // cloudformation (otherwise cfn waits).
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const userHandler = require(exports.external.userHandlerIndex).handler;
        const result = await userHandler(event);
        // validate user response and create the combined event
        const responseEvent = renderResponse(event, result);
        // submit to cfn as success
        await submitResponse('SUCCESS', responseEvent);
    }
    catch (e) {
        const resp = {
            ...event,
            Reason: exports.external.includeStackTraces ? e.stack : e.message,
        };
        if (!resp.PhysicalResourceId) {
            // special case: if CREATE fails, which usually implies, we usually don't
            // have a physical resource id. in this case, the subsequent DELETE
            // operation does not have any meaning, and will likely fail as well. to
            // address this, we use a marker so the provider framework can simply
            // ignore the subsequent DELETE.
            if (event.RequestType === 'Create') {
                exports.external.log('CREATE failed, responding with a marker physical resource id so that the subsequent DELETE will be ignored');
                resp.PhysicalResourceId = CREATE_FAILED_PHYSICAL_ID_MARKER;
            }
            else {
                // otherwise, if PhysicalResourceId is not specified, something is
                // terribly wrong because all other events should have an ID.
                exports.external.log(`ERROR: Malformed event. "PhysicalResourceId" is required: ${JSON.stringify(event)}`);
            }
        }
        // this is an actual error, fail the activity altogether and exist.
        await submitResponse('FAILED', resp);
    }
}
exports.handler = handler;
function renderResponse(cfnRequest, handlerResponse = {}) {
    var _a, _b;
    // if physical ID is not returned, we have some defaults for you based
    // on the request type.
    const physicalResourceId = (_b = (_a = handlerResponse.PhysicalResourceId) !== null && _a !== void 0 ? _a : cfnRequest.PhysicalResourceId) !== null && _b !== void 0 ? _b : cfnRequest.RequestId;
    // if we are in DELETE and physical ID was changed, it's an error.
    if (cfnRequest.RequestType === 'Delete' && physicalResourceId !== cfnRequest.PhysicalResourceId) {
        throw new Error(`DELETE: cannot change the physical resource ID from "${cfnRequest.PhysicalResourceId}" to "${handlerResponse.PhysicalResourceId}" during deletion`);
    }
    // merge request event and result event (result prevails).
    return {
        ...cfnRequest,
        ...handlerResponse,
        PhysicalResourceId: physicalResourceId,
    };
}
async function submitResponse(status, event) {
    var _a;
    const json = {
        Status: status,
        Reason: (_a = event.Reason) !== null && _a !== void 0 ? _a : status,
        StackId: event.StackId,
        RequestId: event.RequestId,
        PhysicalResourceId: event.PhysicalResourceId || MISSING_PHYSICAL_ID_MARKER,
        LogicalResourceId: event.LogicalResourceId,
        NoEcho: event.NoEcho,
        Data: event.Data,
    };
    exports.external.log('submit response to cloudformation', json);
    const responseBody = JSON.stringify(json);
    const parsedUrl = url.parse(event.ResponseURL);
    const req = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.path,
        method: 'PUT',
        headers: { 'content-type': '', 'content-length': responseBody.length },
    };
    await exports.external.sendHttpRequest(req, responseBody);
}
async function defaultSendHttpRequest(options, responseBody) {
    return new Promise((resolve, reject) => {
        try {
            const request = https.request(options, _ => resolve());
            request.on('error', reject);
            request.write(responseBody);
            request.end();
        }
        catch (e) {
            reject(e);
        }
    });
}
function defaultLog(fmt, ...params) {
    // eslint-disable-next-line no-console
    console.log(fmt, ...params);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZWpzLWVudHJ5cG9pbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJub2RlanMtZW50cnlwb2ludC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwrQkFBK0I7QUFDL0IsMkJBQTJCO0FBQzNCLGlCQUFpQjtBQUNKLFFBQUEsUUFBUSxHQUFHO0lBQ3BCLGVBQWUsRUFBRSxzQkFBc0I7SUFDdkMsR0FBRyxFQUFFLFVBQVU7SUFDZixrQkFBa0IsRUFBRSxJQUFJO0lBQ3hCLGdCQUFnQixFQUFFLFNBQVM7Q0FDOUIsQ0FBQztBQUNGLE1BQU0sZ0NBQWdDLEdBQUcsd0RBQXdELENBQUM7QUFDbEcsTUFBTSwwQkFBMEIsR0FBRyw4REFBOEQsQ0FBQztBQVMzRixLQUFLLFVBQVUsT0FBTyxDQUFDLEtBQWtEO0lBQzVFLGdCQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xELHVFQUF1RTtJQUN2RSx1RUFBdUU7SUFDdkUsYUFBYTtJQUNiLElBQUksS0FBSyxDQUFDLFdBQVcsS0FBSyxRQUFRLElBQUksS0FBSyxDQUFDLGtCQUFrQixLQUFLLGdDQUFnQyxFQUFFO1FBQ2pHLGdCQUFRLENBQUMsR0FBRyxDQUFDLHVEQUF1RCxDQUFDLENBQUM7UUFDdEUsTUFBTSxjQUFjLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3ZDLE9BQU87S0FDVjtJQUNELElBQUk7UUFDQSx5RUFBeUU7UUFDekUsaUVBQWlFO1FBQ2pFLHdDQUF3QztRQUN4QyxpRUFBaUU7UUFDakUsTUFBTSxXQUFXLEdBQVksT0FBTyxDQUFDLGdCQUFRLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDeEUsTUFBTSxNQUFNLEdBQUcsTUFBTSxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDeEMsdURBQXVEO1FBQ3ZELE1BQU0sYUFBYSxHQUFHLGNB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LEVBQUUsZ0JBQWdCLEVBQUUsWUFBWSxDQUFDLE1BQU0sRUFBRTtLQUN6RSxDQUFDO0lBQ0YsTUFBTSxnQkFBUSxDQUFDLGVBQWUsQ0FBQyxHQUFHLEVBQUUsWUFBWSxDQUFDLENBQUM7QUFDdEQsQ0FBQztBQUNELEtBQUssVUFBVSxzQkFBc0IsQ0FBQyxPQUE2QixFQUFFLFlBQW9CO0lBQ3JGLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7UUFDbkMsSUFBSTtZQUNBLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUN2RCxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM1QixPQUFPLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzVCLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztTQUNqQjtRQUNELE9BQU8sQ0FBQyxFQUFFO1lBQ04sTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ2I7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUM7QUFDRCxTQUFTLFVBQVUsQ0FBQyxHQUFXLEVBQUUsR0FBRyxNQUFhO0lBQzdDLHNDQUFzQztJQUN0QyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLE1BQU0sQ0FBQyxDQUFDO0FBQ2hDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBodHRwcyBmcm9tICdodHRwcyc7XG5pbXBvcnQgKiBhcyB1cmwgZnJvbSAndXJsJztcbi8vIGZvciB1bml0IHRlc3RzXG5leHBvcnQgY29uc3QgZXh0ZXJuYWwgPSB7XG4gICAgc2VuZEh0dHBSZXF1ZXN0OiBkZWZhdWx0U2VuZEh0dHBSZXF1ZXN0LFxuICAgIGxvZzogZGVmYXVsdExvZyxcbiAgICBpbmNsdWRlU3RhY2tUcmFjZXM6IHRydWUsXG4gICAgdXNlckhhbmRsZXJJbmRleDogJy4vaW5kZXgnLFxufTtcbmNvbnN0IENSRUFURV9GQUlMRURfUEhZU0lDQUxfSURfTUFSS0VSID0gJ0FXU0NESzo6Q3VzdG9tUmVzb3VyY2VQcm92aWRlckZyYW1ld29yazo6Q1JFQVRFX0ZBSUxFRCc7XG5jb25zdCBNSVNTSU5HX1BIWVNJQ0FMX0lEX01BUktFUiA9ICdBV1NDREs6OkN1c3RvbVJlc291cmNlUHJvdmlkZXJGcmFtZXdvcms6Ok1JU1NJTkdfUEhZU0lDQUxfSUQnO1xuZXhwb3J0IHR5cGUgUmVzcG9uc2UgPSBBV1NMYW1iZGEuQ2xvdWRGb3JtYXRpb25DdXN0b21SZXNvdXJjZUV2ZW50ICYgSGFuZGxlclJlc3BvbnNlO1xuZXhwb3J0IHR5cGUgSGFuZGxlciA9IChldmVudDogQVdTTGFtYmRhLkNsb3VkRm9ybWF0aW9uQ3VzdG9tUmVzb3VyY2VFdmVudCkgPT4gUHJvbWlzZTxIYW5kbGVyUmVzcG9uc2UgfCB2b2lkPjtcbmV4cG9ydCB0eXBlIEhhbmRsZXJSZXNwb25zZSA9IHVuZGVmaW5lZCB8IHtcbiAgICBEYXRhPzogYW55O1xuICAgIFBoeXNpY2FsUmVzb3VyY2VJZD86IHN0cmluZztcbiAgICBSZWFzb24/OiBzdHJpbmc7XG4gICAgTm9FY2hvPzogYm9vbGVhbjtcbn07XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihldmVudDogQVdTTGFtYmRhLkNsb3VkRm9ybWF0aW9uQ3VzdG9tUmVzb3VyY2VFdmVudCkge1xuICAgIGV4dGVybmFsLmxvZyhKU09OLnN0cmluZ2lmeShldmVudCwgdW5kZWZpbmVkLCAyKSk7XG4gICAgLy8gaWdub3JlIERFTEVURSBldmVudCB3aGVuIHRoZSBwaHlzaWNhbCByZXNvdXJjZSBJRCBpcyB0aGUgbWFya2VyIHRoYXRcbiAgICAvLyBpbmRpY2F0ZXMgdGhhdCB0aGlzIERFTEVURSBpcyBhIHN1YnNlcXVlbnQgREVMRVRFIHRvIGEgZmFpbGVkIENSRUFURVxuICAgIC8vIG9wZXJhdGlvbi5cbiAgICBpZiAoZXZlbnQuUmVxdWVzdFR5cGUgPT09ICdEZWxldGUnICYmIGV2ZW50LlBoeXNpY2FsUmVzb3VyY2VJZCA9PT0gQ1JFQVRFX0ZBSUxFRF9QSFlTSUNBTF9JRF9NQVJLRVIpIHtcbiAgICAgICAgZXh0ZXJuYWwubG9nKCdpZ25vcmluZyBERUxFVEUgZXZlbnQgY2F1c2VkIGJ5IGEgZmFpbGVkIENSRUFURSBldmVudCcpO1xuICAgICAgICBhd2FpdCBzdWJtaXRSZXNwb25zZSgnU1VDQ0VTUycsIGV2ZW50KTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyBpbnZva2UgdGhlIHVzZXIgaGFuZGxlci4gdGhpcyBpcyBpbnRlbnRpb25hbGx5IGluc2lkZSB0aGUgdHJ5LWNhdGNoIHRvXG4gICAgICAgIC8vIGVuc3VyZSB0aGF0IGlmIHRoZXJlIGlzIGFuIGVycm9yIGl0J3MgcmVwb3J0ZWQgYXMgYSBmYWlsdXJlIHRvXG4gICAgICAgIC8vIGNsb3VkZm9ybWF0aW9uIChvdGhlcndpc2UgY2ZuIHdhaXRzKS5cbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1yZXF1aXJlLWltcG9ydHNcbiAgICAgICAgY29uc3QgdXNlckhhbmRsZXI6IEhhbmRsZXIgPSByZXF1aXJlKGV4dGVybmFsLnVzZXJIYW5kbGVySW5kZXgpLmhhbmRsZXI7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHVzZXJIYW5kbGVyKGV2ZW50KTtcbiAgICAgICAgLy8gdmFsaWRhdGUgdXNlciByZXNwb25zZSBhbmQgY3JlYXRlIHRoZSBjb21iaW5lZCBldmVudFxuICAgICAgICBjb25zdCByZXNwb25zZUV2ZW50ID0gcmVuZGVyUmVzcG9uc2UoZXZlbnQsIHJlc3VsdCk7XG4gICAgICAgIC8vIHN1Ym1pdCB0byBjZm4gYXMgc3VjY2Vzc1xuICAgICAgICBhd2FpdCBzdWJtaXRSZXNwb25zZSgnU1VDQ0VTUycsIHJlc3BvbnNlRXZlbnQpO1xuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgICBjb25zdCByZXNwOiBSZXNwb25zZSA9IHtcbiAgICAgICAgICAgIC4uLmV2ZW50LFxuICAgICAgICAgICAgUmVhc29uOiBleHRlcm5hbC5pbmNsdWRlU3RhY2tUcmFjZXMgPyBlLnN0YWNrIDogZS5tZXNzYWdlLFxuICAgICAgICB9O1xuICAgICAgICBpZiAoIXJlc3AuUGh5c2ljYWxSZXNvdXJjZUlkKSB7XG4gICAgICAgICAgICAvLyBzcGVjaWFsIGNhc2U6IGlmIENSRUFURSBmYWlscywgd2hpY2ggdXN1YWxseSBpbXBsaWVzLCB3ZSB1c3VhbGx5IGRvbid0XG4gICAgICAgICAgICAvLyBoYXZlIGEgcGh5c2ljYWwgcmVzb3VyY2UgaWQuIGluIHRoaXMgY2FzZSwgdGhlIHN1YnNlcXVlbnQgREVMRVRFXG4gICAgICAgICAgICAvLyBvcGVyYXRpb24gZG9lcyBub3QgaGF2ZSBhbnkgbWVhbmluZywgYW5kIHdpbGwgbGlrZWx5IGZhaWwgYXMgd2VsbC4gdG9cbiAgICAgICAgICAgIC8vIGFkZHJlc3MgdGhpcywgd2UgdXNlIGEgbWFya2VyIHNvIHRoZSBwcm92aWRlciBmcmFtZXdvcmsgY2FuIHNpbXBseVxuICAgICAgICAgICAgLy8gaWdub3JlIHRoZSBzdWJzZXF1ZW50IERFTEVURS5cbiAgICAgICAgICAgIGlmIChldmVudC5SZXF1ZXN0VHlwZSA9PT0gJ0NyZWF0ZScpIHtcbiAgICAgICAgICAgICAgICBleHRlcm5hbC5sb2coJ0NSRUFURSBmYWlsZWQsIHJlc3BvbmRpbmcgd2l0aCBhIG1hcmtlciBwaHlzaWNhbCByZXNvdXJjZSBpZCBzbyB0aGF0IHRoZSBzdWJzZXF1ZW50IERFTEVURSB3aWxsIGJlIGlnbm9yZWQnKTtcbiAgICAgICAgICAgICAgICByZXNwLlBoeXNpY2FsUmVzb3VyY2VJZCA9IENSRUFURV9GQUlMRURfUEhZU0lDQUxfSURfTUFSS0VSO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gb3RoZXJ3aXNlLCBpZiBQaHlzaWNhbFJlc291cmNlSWQgaXMgbm90IHNwZWNpZmllZCwgc29tZXRoaW5nIGlzXG4gICAgICAgICAgICAgICAgLy8gdGVycmlibHkgd3JvbmcgYmVjYXVzZSBhbGwgb3RoZXIgZXZlbnRzIHNob3VsZCBoYXZlIGFuIElELlxuICAgICAgICAgICAgICAgIGV4dGVybmFsLmxvZyhgRVJST1I6IE1hbGZvcm1lZCBldmVudC4gXCJQaHlzaWNhbFJlc291cmNlSWRcIiBpcyByZXF1aXJlZDogJHtKU09OLnN0cmluZ2lmeShldmVudCl9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gdGhpcyBpcyBhbiBhY3R1YWwgZXJyb3IsIGZhaWwgdGhlIGFjdGl2aXR5IGFsdG9nZXRoZXIgYW5kIGV4aXN0LlxuICAgICAgICBhd2FpdCBzdWJtaXRSZXNwb25zZSgnRkFJTEVEJywgcmVzcCk7XG4gICAgfVxufVxuZnVuY3Rpb24gcmVuZGVyUmVzcG9uc2UoY2ZuUmVxdWVzdDogQVdTTGFtYmRhLkNsb3VkRm9ybWF0aW9uQ3VzdG9tUmVzb3VyY2VFdmVudCAmIHtcbiAgICBQaHlzaWNhbFJlc291cmNlSWQ/OiBzdHJpbmc7XG59LCBoYW5kbGVyUmVzcG9uc2U6IHZvaWQgfCBIYW5kbGVyUmVzcG9uc2UgPSB7fSk6IFJlc3BvbnNlIHtcbiAgICAvLyBpZiBwaHlzaWNhbCBJRCBpcyBub3QgcmV0dXJuZWQsIHdlIGhhdmUgc29tZSBkZWZhdWx0cyBmb3IgeW91IGJhc2VkXG4gICAgLy8gb24gdGhlIHJlcXVlc3QgdHlwZS5cbiAgICBjb25zdCBwaHlzaWNhbFJlc291cmNlSWQgPSBoYW5kbGVyUmVzcG9uc2UuUGh5c2ljYWxSZXNvdXJjZUlkID8/IGNmblJlcXVlc3QuUGh5c2ljYWxSZXNvdXJjZUlkID8/IGNmblJlcXVlc3QuUmVxdWVzdElkO1xuICAgIC8vIGlmIHdlIGFyZSBpbiBERUxFVEUgYW5kIHBoeXNpY2FsIElEIHdhcyBjaGFuZ2VkLCBpdCdzIGFuIGVycm9yLlxuICAgIGlmIChjZm5SZXF1ZXN0LlJlcXVlc3RUeXBlID09PSAnRGVsZXRlJyAmJiBwaHlzaWNhbFJlc291cmNlSWQgIT09IGNmblJlcXVlc3QuUGh5c2ljYWxSZXNvdXJjZUlkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgREVMRVRFOiBjYW5ub3QgY2hhbmdlIHRoZSBwaHlzaWNhbCByZXNvdXJjZSBJRCBmcm9tIFwiJHtjZm5SZXF1ZXN0LlBoeXNpY2FsUmVzb3VyY2VJZH1cIiB0byBcIiR7aGFuZGxlclJlc3BvbnNlLlBoeXNpY2FsUmVzb3VyY2VJZH1cIiBkdXJpbmcgZGVsZXRpb25gKTtcbiAgICB9XG4gICAgLy8gbWVyZ2UgcmVxdWVzdCBldmVudCBhbmQgcmVzdWx0IGV2ZW50IChyZXN1bHQgcHJldmFpbHMpLlxuICAgIHJldHVybiB7XG4gICAgICAgIC4uLmNmblJlcXVlc3QsXG4gICAgICAgIC4uLmhhbmRsZXJSZXNwb25zZSxcbiAgICAgICAgUGh5c2ljYWxSZXNvdXJjZUlkOiBwaHlzaWNhbFJlc291cmNlSWQsXG4gICAgfTtcbn1cbmFzeW5jIGZ1bmN0aW9uIHN1Ym1pdFJlc3BvbnNlKHN0YXR1czogJ1NVQ0NFU1MnIHwgJ0ZBSUxFRCcsIGV2ZW50OiBSZXNwb25zZSkge1xuICAgIGNvbnN0IGpzb246IEFXU0xhbWJkYS5DbG91ZEZvcm1hdGlvbkN1c3RvbVJlc291cmNlUmVzcG9uc2UgPSB7XG4gICAgICAgIFN0YXR1czogc3RhdHVzLFxuICAgICAgICBSZWFzb246IGV2ZW50LlJlYXNvbiA/PyBzdGF0dXMsXG4gICAgICAgIFN0YWNrSWQ6IGV2ZW50LlN0YWNrSWQsXG4gICAgICAgIFJlcXVlc3RJZDogZXZlbnQuUmVxdWVzdElkLFxuICAgICAgICBQaHlzaWNhbFJlc291cmNlSWQ6IGV2ZW50LlBoeXNpY2FsUmVzb3VyY2VJZCB8fCBNSVNTSU5HX1BIWVNJQ0FMX0lEX01BUktFUixcbiAgICAgICAgTG9naWNhbFJlc291cmNlSWQ6IGV2ZW50LkxvZ2ljYWxSZXNvdXJjZUlkLFxuICAgICAgICBOb0VjaG86IGV2ZW50Lk5vRWNobyxcbiAgICAgICAgRGF0YTogZXZlbnQuRGF0YSxcbiAgICB9O1xuICAgIGV4dGVybmFsLmxvZygnc3VibWl0IHJlc3BvbnNlIHRvIGNsb3VkZm9ybWF0aW9uJywganNvbik7XG4gICAgY29uc3QgcmVzcG9uc2VCb2R5ID0gSlNPTi5zdHJpbmdpZnkoanNvbik7XG4gICAgY29uc3QgcGFyc2VkVXJsID0gdXJsLnBhcnNlKGV2ZW50LlJlc3BvbnNlVVJMKTtcbiAgICBjb25zdCByZXEgPSB7XG4gICAgICAgIGhvc3RuYW1lOiBwYXJzZWRVcmwuaG9zdG5hbWUsXG4gICAgICAgIHBhdGg6IHBhcnNlZFVybC5wYXRoLFxuICAgICAgICBtZXRob2Q6ICdQVVQnLFxuICAgICAgICBoZWFkZXJzOiB7ICdjb250ZW50LXR5cGUnOiAnJywgJ2NvbnRlbnQtbGVuZ3RoJzogcmVzcG9uc2VCb2R5Lmxlbmd0aCB9LFxuICAgIH07XG4gICAgYXdhaXQgZXh0ZXJuYWwuc2VuZEh0dHBSZXF1ZXN0KHJlcSwgcmVzcG9uc2VCb2R5KTtcbn1cbmFzeW5jIGZ1bmN0aW9uIGRlZmF1bHRTZW5kSHR0cFJlcXVlc3Qob3B0aW9uczogaHR0cHMuUmVxdWVzdE9wdGlvbnMsIHJlc3BvbnNlQm9keTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBodHRwcy5yZXF1ZXN0KG9wdGlvbnMsIF8gPT4gcmVzb2x2ZSgpKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub24oJ2Vycm9yJywgcmVqZWN0KTtcbiAgICAgICAgICAgIHJlcXVlc3Qud3JpdGUocmVzcG9uc2VCb2R5KTtcbiAgICAgICAgICAgIHJlcXVlc3QuZW5kKCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJlamVjdChlKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuZnVuY3Rpb24gZGVmYXVsdExvZyhmbXQ6IHN0cmluZywgLi4ucGFyYW1zOiBhbnlbXSkge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgY29uc29sZS5sb2coZm10LCAuLi5wYXJhbXMpO1xufVxuIl19
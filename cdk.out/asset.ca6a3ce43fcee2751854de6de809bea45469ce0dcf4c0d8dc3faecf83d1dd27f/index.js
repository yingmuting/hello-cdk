"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
// eslint-disable-next-line import/no-extraneous-dependencies
const aws_sdk_1 = require("aws-sdk");
const s3 = new aws_sdk_1.S3();
async function handler(event) {
    switch (event.RequestType) {
        case 'Create':
        case 'Update':
            return;
        case 'Delete':
            return onDelete(event);
    }
}
exports.handler = handler;
/**
 * Recursively delete all items in the bucket
 *
 * @param bucketName the bucket name
 */
async function emptyBucket(bucketName) {
    var _a, _b;
    const listedObjects = await s3.listObjectVersions({ Bucket: bucketName }).promise();
    const contents = [...(_a = listedObjects.Versions) !== null && _a !== void 0 ? _a : [], ...(_b = listedObjects.DeleteMarkers) !== null && _b !== void 0 ? _b : []];
    if (contents.length === 0) {
        return;
    }
    ;
    const records = contents.map((record) => ({ Key: record.Key, VersionId: record.VersionId }));
    await s3.deleteObjects({ Bucket: bucketName, Delete: { Objects: records } }).promise();
    if (listedObjects === null || listedObjects === void 0 ? void 0 : listedObjects.IsTruncated) {
        await emptyBucket(bucketName);
    }
}
async function onDelete(deleteEvent) {
    var _a;
    const bucketName = (_a = deleteEvent.ResourceProperties) === null || _a === void 0 ? void 0 : _a.BucketName;
    if (!bucketName) {
        throw new Error('No BucketName was provided.');
    }
    await emptyBucket(bucketName);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2REFBNkQ7QUFDN0QscUNBQTZCO0FBQzdCLE1BQU0sRUFBRSxHQUFHLElBQUksWUFBRSxFQUFFLENBQUM7QUFDYixLQUFLLFVBQVUsT0FBTyxDQUFDLEtBQWtEO0lBQzVFLFFBQVEsS0FBSyxDQUFDLFdBQVcsRUFBRTtRQUN2QixLQUFLLFFBQVEsQ0FBQztRQUNkLEtBQUssUUFBUTtZQUNULE9BQU87UUFDWCxLQUFLLFFBQVE7WUFDVCxPQUFPLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUM5QjtBQUNMLENBQUM7QUFSRCwwQkFRQztBQUNEOzs7O0dBSUc7QUFDSCxLQUFLLFVBQVUsV0FBVyxDQUFDLFVBQWtCOztJQUN6QyxNQUFNLGFBQWEsR0FBRyxNQUFNLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ3BGLE1BQU0sUUFBUSxHQUFHLENBQUMsU0FBRyxhQUFhLENBQUMsUUFBUSxtQ0FBSSxFQUFFLEVBQUUsU0FBRyxhQUFhLENBQUMsYUFBYSxtQ0FBSSxFQUFFLENBQUMsQ0FBQztJQUN6RixJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1FBQ3ZCLE9BQU87S0FDVjtJQUNELENBQUM7SUFDRCxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxHQUFHLEVBQUUsU0FBUyxFQUFFLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDbEcsTUFBTSxFQUFFLENBQUMsYUFBYSxDQUFDLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ3ZGLElBQUksYUFBYSxhQUFiLGFBQWEsdUJBQWIsYUFBYSxDQUFFLFdBQVcsRUFBRTtRQUM1QixNQUFNLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQztLQUNqQztBQUNMLENBQUM7QUFDRCxLQUFLLFVBQVUsUUFBUSxDQUFDLFdBQThEOztJQUNsRixNQUFNLFVBQVUsU0FBRyxXQUFXLENBQUMsa0JBQWtCLDBDQUFFLFVBQVUsQ0FBQztJQUM5RCxJQUFJLENBQUMsVUFBVSxFQUFFO1FBQ2IsTUFBTSxJQUFJLEtBQUssQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO0tBQ2xEO0lBQ0QsTUFBTSxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDbEMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBpbXBvcnQvbm8tZXh0cmFuZW91cy1kZXBlbmRlbmNpZXNcbmltcG9ydCB7IFMzIH0gZnJvbSAnYXdzLXNkayc7XG5jb25zdCBzMyA9IG5ldyBTMygpO1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIoZXZlbnQ6IEFXU0xhbWJkYS5DbG91ZEZvcm1hdGlvbkN1c3RvbVJlc291cmNlRXZlbnQpIHtcbiAgICBzd2l0Y2ggKGV2ZW50LlJlcXVlc3RUeXBlKSB7XG4gICAgICAgIGNhc2UgJ0NyZWF0ZSc6XG4gICAgICAgIGNhc2UgJ1VwZGF0ZSc6XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNhc2UgJ0RlbGV0ZSc6XG4gICAgICAgICAgICByZXR1cm4gb25EZWxldGUoZXZlbnQpO1xuICAgIH1cbn1cbi8qKlxuICogUmVjdXJzaXZlbHkgZGVsZXRlIGFsbCBpdGVtcyBpbiB0aGUgYnVja2V0XG4gKlxuICogQHBhcmFtIGJ1Y2tldE5hbWUgdGhlIGJ1Y2tldCBuYW1lXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGVtcHR5QnVja2V0KGJ1Y2tldE5hbWU6IHN0cmluZykge1xuICAgIGNvbnN0IGxpc3RlZE9iamVjdHMgPSBhd2FpdCBzMy5saXN0T2JqZWN0VmVyc2lvbnMoeyBCdWNrZXQ6IGJ1Y2tldE5hbWUgfSkucHJvbWlzZSgpO1xuICAgIGNvbnN0IGNvbnRlbnRzID0gWy4uLmxpc3RlZE9iamVjdHMuVmVyc2lvbnMgPz8gW10sIC4uLmxpc3RlZE9iamVjdHMuRGVsZXRlTWFya2VycyA/PyBbXV07XG4gICAgaWYgKGNvbnRlbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIDtcbiAgICBjb25zdCByZWNvcmRzID0gY29udGVudHMubWFwKChyZWNvcmQ6IGFueSkgPT4gKHsgS2V5OiByZWNvcmQuS2V5LCBWZXJzaW9uSWQ6IHJlY29yZC5WZXJzaW9uSWQgfSkpO1xuICAgIGF3YWl0IHMzLmRlbGV0ZU9iamVjdHMoeyBCdWNrZXQ6IGJ1Y2tldE5hbWUsIERlbGV0ZTogeyBPYmplY3RzOiByZWNvcmRzIH0gfSkucHJvbWlzZSgpO1xuICAgIGlmIChsaXN0ZWRPYmplY3RzPy5Jc1RydW5jYXRlZCkge1xuICAgICAgICBhd2FpdCBlbXB0eUJ1Y2tldChidWNrZXROYW1lKTtcbiAgICB9XG59XG5hc3luYyBmdW5jdGlvbiBvbkRlbGV0ZShkZWxldGVFdmVudDogQVdTTGFtYmRhLkNsb3VkRm9ybWF0aW9uQ3VzdG9tUmVzb3VyY2VEZWxldGVFdmVudCkge1xuICAgIGNvbnN0IGJ1Y2tldE5hbWUgPSBkZWxldGVFdmVudC5SZXNvdXJjZVByb3BlcnRpZXM/LkJ1Y2tldE5hbWU7XG4gICAgaWYgKCFidWNrZXROYW1lKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gQnVja2V0TmFtZSB3YXMgcHJvdmlkZWQuJyk7XG4gICAgfVxuICAgIGF3YWl0IGVtcHR5QnVja2V0KGJ1Y2tldE5hbWUpO1xufVxuIl19
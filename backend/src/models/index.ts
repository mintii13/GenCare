// Core Models
export { default as User } from './User';
export { default as Customer } from './Customer';
export { default as Admin } from './Admin';
export { default as Staff } from './Staff';
export { default as Consultant } from './Consultant';

// Testing & Consultation Models
export { default as STITest } from './STITest';
export { default as Booking } from './Booking';
export { default as TestResult } from './TestResult';

// Test Management Models
export { default as TestType } from './TestType';
export { default as TestPackage } from './TestPackage';
export { default as PackageTest } from './PackageTest';

// Facility & Infrastructure Models
export { default as MedicalFacility } from './MedicalFacility';

// Communication & Content Models
export { default as Notification } from './Notification';
export { default as BlogPost } from './BlogPost';

// Feedback & Rating Models
export { default as Feedback } from './Feedback';

// Export interfaces as well for TypeScript
export type { IUser } from './User';
export type { ICustomer } from './Customer';
export type { ISTITest } from './STITest';
export type { IBooking } from './Booking';
export type { ITestResult } from './TestResult';
export type { ITestType } from './TestType';
export type { ITestPackage } from './TestPackage';
export type { IPackageTest } from './PackageTest';
export type { IMedicalFacility } from './MedicalFacility';
export type { INotification } from './Notification';
export type { IBlogPost } from './BlogPost';
export type { IFeedback } from './Feedback'; 
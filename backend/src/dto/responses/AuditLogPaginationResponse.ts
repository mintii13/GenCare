import { IStiAuditLog } from '../../models/StiAuditLog';
import { PaginatedResponse } from './PaginationResponse';

export interface AuditLogPaginationResponse extends PaginatedResponse<IStiAuditLog> { }

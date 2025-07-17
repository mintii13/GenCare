import { TargetType } from '../../models/StiAuditLog';
import { PaginationQuery } from './PaginationRequest';

export interface AuditLogQuery extends PaginationQuery {
    target_type?: TargetType;
    target_id?: string;
    user_id?: string;
    action?: string;
    date_from?: string;
    date_to?: string;
}
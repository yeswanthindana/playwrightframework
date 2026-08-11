export interface RegionOfInterestDbModel {
    id: number;
    stream_id: number;
    name: string;
    unique_id: string;
    version: number;
    regiondetails: Record<string, unknown>;
    is_restricted: boolean;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    created_by: string;
    updated_by: string;
}
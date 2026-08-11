export interface StreamfeedDbModel {
    frame_id: number;
    stream_id: number;
    detection_json: Record<string, unknown>;
    capture_time: Date;
    created_time: Date;
    frame_uuid: string;
    object_count: Record<string, unknown>;
    is_smart: boolean;
    file_src: string;
    reference_frame_id: number | null;
    updated_at: Date;
    timestamp_origin: Date;
    summary: string | null;
    vlm_response_time: number | null;
}
export interface AddStreamRegionsData {
    name:string,
    description: string,
    facility: string,
    region_name: string,
    select_computeNode: string,
    feed_type: string,
    rtsp_link: string,
    validation_message: string,
    region_name: string,
    toast_message: string
}

export interface ValidateStreamRegions {
    name?: string;
    facility?: string;
    select_computeNode?: string;
    rtsp_link?: string;
    region_name?: string;
    validation_message: string;
}

export interface UpdateStreamData {
    name?: string;
    rtsp_link?: string;
    toast_message: string;
}

export interface DeleteStreamData {
    name: string;
    delete_confirmation_message: string;
    toast_message: string;
}
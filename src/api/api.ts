import client, { setConfig } from "./client";

export interface ISendText {
    input_text: string;
    speaker: number;
    phrase_break: number;
    audiovisual: number;
}

export const api = {
    sendText: async (api_url: string, api_key: string, requests: ISendText) => {
        setConfig({
            headers: {
                "Content-Type": "application/json",
                Apikey: api_key,
            },
        });

        const response = await client.post(api_url, requests);
        return response;
    },
    getVoice: async (api_url: string, api_key: string) => {
        setConfig({
            headers: {
                Apikey: api_key,
            },
        });

        const response = await client.get(api_url, { responseType: "blob" });
        return response;
    },
    getBlendShapes: async (api_url: string, api_key: string) => {
        setConfig({
            headers: {
                Apikey: api_key,
            },
        });

        const response = await client.get(api_url);
        return response;
    },
    sendChat: async (backend_url: string, requests: { prompt: string; sessionid: string }) => {
        const response = await client.post(backend_url, requests);
        return response;
    },
};

export default api;

import axios from 'axios';

export function GetChats(token: string) {

    return axios({
        method: 'GET',
        headers: { Authorization: token },
        url: '',
    })
}

export function GetChatMessages(token: string) {

    return axios({
        method: 'GET',
        headers: { Authorization: token },
        url: '',
    })
}

export function GetViaUrl(url: string, token: string) {

    return axios({
        method: 'GET',
        headers: { Authorization: token },
        url,
    })
}
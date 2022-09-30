import React from 'react'
import axios from 'axios'
import { token } from '../personal/token'

const hostGraph = "https://graph.microsoft.com"

export const getMe = () => {
    const uri = `${hostGraph}/v1.0/me`;
    const opt = {
        headers: { Accept: 'application/json', Authorization: token }
    }
    return axios.get(uri, opt)
}

export const getChatMessages = (id: string) => {
    const uri = `${hostGraph}/beta/chats/${id}/messages?$top=50`;
    const opt = {
        headers: { Accept: 'application/json', Authorization: token }
    }
    return axios.get(uri, opt)
}

export const getChats = () => {
    const uri = `${hostGraph}/beta/chats?$top=50&$expand=members`;
    const opt = {
        headers: { Accept: 'application/json', Authorization: token }
    }
    return axios.get(uri, opt)
}

export const getViaToken = (uriToken: string) => {
    const uri = uriToken;
    const opt = {
        headers: { Accept: 'application/json', Authorization: token }
    }
    return axios.get(uri, opt)
}
import React, { FC, useState, useMemo, useEffect } from "react";
import { NetlifyAPI, NetlifyBuild, NetlifySite } from '../lib/netlify'
import { NetlifyHistoryView } from "../netlify-history-view";
import { CommitsData } from "../types";

interface NetlifyHistoryProps {
    accessToken: string;
    repoURL: string;
    fetchShaInfo: (shas: string[]) => Promise<CommitsData>;
    onDismiss: () => void;
}

export const NetlifyHistory: FC<NetlifyHistoryProps> = ({ accessToken, repoURL, fetchShaInfo, onDismiss }) => {
    const netlify = useMemo(() => accessToken ? new NetlifyAPI(accessToken) : null, [accessToken])
    const [sites, setSites] = useState<NetlifySite[]>([])
    const [site, setSite] = useState<NetlifySite | null>(null)
    const [builds, setBuilds] = useState<NetlifyBuild[]>([])
    const [commits, setCommits] = useState<CommitsData>({})
    useEffect(() => {
        netlify?.listSites().then(sites => setSites(sites))
    }, [netlify])
    useEffect(() => {
        for (const site of sites) {
            if (site.build_settings.repo_url === repoURL) {
                setSite(site)
                break
            }
        }
    }, [sites])
    useEffect(() => {
        if (site) {
            netlify.listSiteBuilds(site?.id).then(builds => setBuilds(builds))
        }
    }, [site])
    useEffect(() => {
        fetchShaInfo(builds.map(build => build.sha)).then(commits => setCommits(commits));
    }, [builds])
    if (!site) {
        return <div>Loading...</div>
    }
    return (
        <NetlifyHistoryView
            site={site}
            builds={builds}
            commits={commits}
            onDismiss={onDismiss}
        />
    );
}

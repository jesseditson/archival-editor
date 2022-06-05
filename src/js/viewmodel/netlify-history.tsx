import React, { FC, useState, useMemo, useEffect } from "react";
import { NetlifyAPI, NetlifyBuild, NetlifySite } from 'netlify'
import { NetlifyHistoryView } from "../netlify-history-view";

interface NetlifyHistoryProps {
    accessToken: string
    repoURL: string
}

export const NetlifyHistory: FC<NetlifyHistoryProps> = ({ accessToken, repoURL }) => {
    const netlify = useMemo(() => new NetlifyAPI(accessToken), [accessToken])
    const [sites, setSites] = useState<NetlifySite[]>([])
    const [site, setSite] = useState<NetlifySite | null>(null)
    const [builds, setBuilds] = useState<NetlifyBuild[]>([])
    useEffect(() => {
        netlify.listSites().then(sites => setSites(sites))
    }, [netlify])
    useEffect(() => {
        for (const site of sites) {
            console.log(site.build_settings.repo_url, repoURL)
            if (site.build_settings.repo_url === repoURL) {
                setSite(site)
                break
            }
        }
    }, [sites])
    useEffect(() => {
        if (site) {
            netlify.listSiteBuilds({ site_id: site?.id }).then(builds => setBuilds(builds))
        }
    }, [site])
    if (!site) {
        return <div>Loading...</div>
    }
    return (
        <NetlifyHistoryView
            site={site}
            builds={builds}
        />
    );
}

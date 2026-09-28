import {notFound} from "next/navigation";
import {isDesignId,designSector} from "@/lib/storefront/sector-design/config";
import {DEMO_FIXTURES} from "@/lib/storefront/sector-design/demo-fixtures";
import {PublicThemeDemo} from "@/components/storefront/sector-design/public-demo";
export const metadata={title:"Canlı tema demosu",robots:{index:false,follow:true}};
export default async function Page({params}:{params:Promise<{theme:string}>}){const {theme}=await params;if(!isDesignId(theme))notFound();const fixture=DEMO_FIXTURES[designSector(theme)!]?.();if(!fixture)notFound();return <PublicThemeDemo {...fixture} initialTheme={theme}/>;}

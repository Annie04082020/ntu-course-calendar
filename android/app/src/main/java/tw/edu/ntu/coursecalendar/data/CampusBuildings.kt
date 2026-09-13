package tw.edu.ntu.coursecalendar.data

import android.content.Context
import android.content.Intent
import android.net.Uri

data class BuildingInfo(
    val id: String,
    val name: String,
    val nameEn: String,
    val lat: Double,
    val lng: Double,
    val aliases: List<String>
)

data class ResolvedLocation(
    val building: BuildingInfo,
    val room: String,
    val raw: String
) {
    fun getDisplayName(isEnglish: Boolean = false): String {
        val bName = if (isEnglish) building.nameEn else building.name
        return if (room.isNotBlank()) "$bName $room" else bName
    }
}

object CampusBuildings {

    val BUILDINGS = listOf(
        // 主要教學館
        BuildingInfo("boya", "博雅教學館", "Boya Teaching Building", 25.019183, 121.541457, listOf("博雅", "博")),
        BuildingInfo("xinsheng", "新生教學館", "Xinsheng Teaching Building", 25.019777, 121.543088, listOf("新生", "新")),
        BuildingInfo("putong", "普通教學館", "Putong Teaching Building", 25.018265, 121.537243, listOf("普通", "普")),
        BuildingInfo("zonghe", "綜合教學館", "Zonghe Teaching Building", 25.019728, 121.539824, listOf("綜合", "綜")),
        BuildingInfo("gongtong", "共同教學館", "Gongtong Teaching Building", 25.016335, 121.537824, listOf("共同", "共")),
        BuildingInfo("zhuoyue", "卓越研究大樓", "Excellence Research Building", 25.018449, 121.543594, listOf("卓越", "創")),

        // 電資與工學院
        BuildingInfo("csie", "德田館 (資訊系)", "Dept. of CSIE (Der-Tian Hall)", 25.019488, 121.541812, listOf("德田", "資訊", "資")),
        BuildingInfo("mingda", "明達館", "Ming-Da Hall", 25.018899, 121.544199, listOf("明達")),
        BuildingInfo("barrylam", "博理館", "Barry Lam Hall", 25.019283, 121.542718, listOf("博理")),
        BuildingInfo("ee2", "電機二館", "EE Building 2", 25.018900, 121.543200, listOf("電二", "電機二館")),
        BuildingInfo("gongzong", "工學院綜合大樓", "Engineering Building", 25.018854, 121.540412, listOf("工綜")),
        BuildingInfo("civil", "土木工程館", "Civil Engineering Building", 25.018318, 121.540188, listOf("土木")),
        BuildingInfo("chem_eng", "化工館", "Chemical Engineering Building", 25.017772, 121.540842, listOf("化工")),
        BuildingInfo("mech", "機械工程館", "Mechanical Engineering Building", 25.017992, 121.541334, listOf("機械")),

        // 管理學院、社科院、法學院
        BuildingInfo("mgmt1", "管理學院一號館", "College of Management Bldg 1", 25.013478, 121.538556, listOf("管一", "管1", "管理一")),
        BuildingInfo("mgmt2", "管理學院二號館", "College of Management Bldg 2", 25.012588, 121.539122, listOf("管二", "管2", "管理二")),
        BuildingInfo("socsci", "社會科學院大樓", "College of Social Sciences", 25.021516, 121.543419, listOf("社科", "社科院")),
        BuildingInfo("law_linze", "法律學院霖澤館", "Lin-Ze Hall (Law)", 25.021008, 121.544258, listOf("霖澤", "法學")),
        BuildingInfo("law_wancai", "法律學院萬才館", "Wan-Tsai Hall (Law)", 25.020588, 121.544588, listOf("萬才")),

        // 理學院與生農
        BuildingInfo("shihliang", "思亮館", "Shih-Liang Hall", 25.018788, 121.538812, listOf("思亮")),
        BuildingInfo("condensed", "凝態科學研究館", "Condensed Matter Science Bldg", 25.021544, 121.536988, listOf("凝態", "新物")),
        BuildingInfo("astro_math", "天文數學館", "Astronomy-Mathematics Building", 25.021622, 121.538055, listOf("天數", "天文數學")),
        BuildingInfo("lifesci", "生命科學館", "Life Science Building", 25.016088, 121.539588, listOf("生科", "生命科學")),
        BuildingInfo("agchem", "農化新館", "Agricultural Chemistry Building", 25.016888, 121.539888, listOf("農化")),
        BuildingInfo("forestry", "森林館", "Forestry Building", 25.016288, 121.538888, listOf("森林")),

        // 總圖、活動中心、體育館
        BuildingInfo("library", "總圖書館", "Main Library", 25.017361, 121.540544, listOf("總圖", "圖書館")),
        BuildingInfo("sac1", "第一學生活動中心", "Student Activity Center 1", 25.017888, 121.537988, listOf("一活", "活一")),
        BuildingInfo("sac2", "第二學生活動中心", "Student Activity Center 2", 25.010588, 121.535888, listOf("二活", "活二")),
        BuildingInfo("gym_new", "綜合體育館 (新體)", "New Sports Center", 25.021788, 121.535588, listOf("新體", "體育館", "巨蛋")),
        BuildingInfo("gym_old", "舊體育館", "Old Sports Center", 25.019188, 121.536888, listOf("舊體")),

        // 醫學校區
        BuildingInfo("med", "醫學院基礎醫學大樓", "College of Medicine", 25.040188, 121.518888, listOf("醫學院", "基醫"))
    )

    /**
     * 解析台大教室字串（例如 "博101", "博雅101", "新202", "普通103", "管一102", "德田105"）
     */
    fun resolveLocation(rawLocation: String?): ResolvedLocation? {
        if (rawLocation.isNullOrBlank()) return null
        val clean = rawLocation.trim().replace("\\s+".toRegex(), "")

        // 依別名長度降冪排序，避免 "博" 搶先匹配 "博理" 或 "博雅"
        val sortedBuildings = BUILDINGS.flatMap { b ->
            b.aliases.map { alias -> alias to b }
        }.sortedByDescending { it.first.length }

        for ((alias, building) in sortedBuildings) {
            if (clean.startsWith(alias, ignoreCase = true)) {
                val room = clean.substring(alias.length)
                return ResolvedLocation(building, room, rawLocation)
            }
            if (clean.contains(alias, ignoreCase = true)) {
                val room = clean.replace(alias, "")
                return ResolvedLocation(building, room, rawLocation)
            }
        }
        return null
    }

    /**
     * 建立 Google Maps 步行導航 Intent
     */
    fun getWalkingNavigationIntent(building: BuildingInfo): Intent {
        val uri = Uri.parse("google.navigation:q=${building.lat},${building.lng}&mode=w")
        val intent = Intent(Intent.ACTION_VIEW, uri)
        intent.setPackage("com.google.android.apps.maps")
        return intent
    }

    /**
     * 備用通用地圖 Intent（若使用者未裝 Google Maps App）
     */
    fun getMapGeoIntent(building: BuildingInfo): Intent {
        val label = Uri.encode(building.name)
        val uri = Uri.parse("geo:0,0?q=${building.lat},${building.lng}($label)")
        return Intent(Intent.ACTION_VIEW, uri)
    }

    /**
     * 啟動導航
     */
    fun launchNavigation(context: Context, building: BuildingInfo): Boolean {
        return try {
            val mapsIntent = getWalkingNavigationIntent(building).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(mapsIntent)
            true
        } catch (e: Exception) {
            try {
                val geoIntent = getMapGeoIntent(building).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(geoIntent)
                true
            } catch (e2: Exception) {
                false
            }
        }
    }
}

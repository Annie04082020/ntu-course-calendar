package tw.edu.ntu.coursecalendar.widget

import androidx.compose.ui.graphics.Color

object WidgetColors {
    val BgStart = Color(0xFF141824)
    val BgEnd = Color(0xFF0B0E14)
    val CardBg = Color(0x991E2433)
    val CardHighlight = Color(0x383B82F6)
    val Border = Color(0xB22D3748)
    val PrimaryText = Color(0xFFFFFFFF)
    val SecondaryText = Color(0xFF94A3B8)
    val Accent = Color(0xFF60A5FA)
    val AccentGlow = Color(0xFF38BDF8)
    val Success = Color(0xFF34D399)
    val Warning = Color(0xFFFBBF24)
    val TodayBadge = Color(0xFF2563EB)

    data class CourseTheme(
        val bg: Color,
        val border: Color,
        val text: Color,
        val sub: Color
    )

    val COURSE_PALETTES = listOf(
        CourseTheme(Color(0x601D4ED8), Color(0xA660A5FA), Color(0xFFFFFFFF), Color(0xFFBFDBFE)), // 藍
        CourseTheme(Color(0x60047857), Color(0xA634D399), Color(0xFFFFFFFF), Color(0xFFA7F3D0)), // 綠
        CourseTheme(Color(0x606D28D9), Color(0xA6A78BFA), Color(0xFFFFFFFF), Color(0xFFDDD6FE)), // 紫
        CourseTheme(Color(0x60B45309), Color(0xA6FBBF24), Color(0xFFFFFFFF), Color(0xFFFDE68A)), // 琥珀
        CourseTheme(Color(0x60BE185D), Color(0xA6F472B6), Color(0xFFFFFFFF), Color(0xFFFBCFE8)), // 玫瑰
        CourseTheme(Color(0x600E7490), Color(0xA622D3EE), Color(0xFFFFFFFF), Color(0xFFA5F3FC)), // 青
        CourseTheme(Color(0x604338CA), Color(0xA6818CF8), Color(0xFFFFFFFF), Color(0xFFC7D2FE))  // 靛藍
    )

    fun getCourseTheme(courseName: String): CourseTheme {
        var hash = 0
        for (ch in courseName) {
            hash = (hash * 31 + ch.code) % COURSE_PALETTES.size
        }
        return COURSE_PALETTES[Math.abs(hash)]
    }
}

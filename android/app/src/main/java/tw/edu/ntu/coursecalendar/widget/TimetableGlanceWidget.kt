package tw.edu.ntu.coursecalendar.widget

import android.content.Context
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.action.actionStartActivity
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.*
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import tw.edu.ntu.coursecalendar.MainActivity
import tw.edu.ntu.coursecalendar.data.CourseParser
import tw.edu.ntu.coursecalendar.data.CourseRepository
import tw.edu.ntu.coursecalendar.data.NTUPeriods
import java.util.*

class TimetableGlanceWidget : GlanceAppWidget() {

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val repo = CourseRepository(context)
        val courses = repo.getCourses()
        val weekSchedule = CourseParser.buildWeekSchedule(courses)

        // 計算當前星期與時間
        val calendar = Calendar.getInstance()
        val dayOfWeekInt = calendar.get(Calendar.DAY_OF_WEEK)
        val currentWeekday = when (dayOfWeekInt) {
            Calendar.MONDAY -> "一"
            Calendar.TUESDAY -> "二"
            Calendar.WEDNESDAY -> "三"
            Calendar.THURSDAY -> "四"
            Calendar.FRIDAY -> "五"
            Calendar.SATURDAY -> "六"
            else -> "日"
        }
        val month = calendar.get(Calendar.MONTH) + 1
        val dayOfMonth = calendar.get(Calendar.DAY_OF_MONTH)

        // 計算課表節次範圍 (最少顯示 1~8 節 08:10~16:20)
        val allUsedIndices = mutableListOf<Int>()
        weekSchedule.values.forEach { list ->
            list.forEach { c ->
                val sIdx = NTUPeriods.ORDER.indexOf(c.firstPeriod)
                val eIdx = NTUPeriods.ORDER.indexOf(c.lastPeriod)
                if (sIdx != -1 && eIdx != -1) {
                    for (i in sIdx..eIdx) allUsedIndices.add(i)
                }
            }
        }
        var minPIdx = NTUPeriods.ORDER.indexOf("1")
        var maxPIdx = NTUPeriods.ORDER.indexOf("8")
        if (allUsedIndices.isNotEmpty()) {
            val dMin = allUsedIndices.minOrNull() ?: minPIdx
            val dMax = allUsedIndices.maxOrNull() ?: maxPIdx
            if (dMin < minPIdx) minPIdx = dMin
            if (dMax > maxPIdx) maxPIdx = dMax
        }
        val displayPeriods = NTUPeriods.ORDER.subList(minPIdx, maxPIdx + 1)

        val numPeriods = displayPeriods.size
        val rowHeight = when {
            numPeriods <= 7 -> 34.dp
            numPeriods == 8 -> 30.dp
            numPeriods == 9 -> 26.dp
            numPeriods == 10 -> 23.dp
            else -> 20.dp
        }
        val gap = if (numPeriods >= 10) 2.dp else 3.dp
        val headerRowHeight = 20.dp

        val hasWeekend = (weekSchedule["六"]?.isNotEmpty() == true) || (weekSchedule["日"]?.isNotEmpty() == true)
        val schoolDays = if (hasWeekend) listOf("一", "二", "三", "四", "五", "六") else listOf("一", "二", "三", "四", "五")

        provideContent {
            Column(
                modifier = GlanceModifier
                    .fillMaxSize()
                    .background(WidgetColors.BgStart)
                    .cornerRadius(16.dp)
                    .padding(8.dp)
                    .clickable(actionStartActivity<MainActivity>())
            ) {
                // 1. 頂部標題列
                Row(
                    modifier = GlanceModifier.fillMaxWidth().padding(horizontal = 4.dp, vertical = 2.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "📅 臺大週課表",
                        style = TextStyle(
                            color = ColorProvider(WidgetColors.Accent),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    )
                    Spacer(modifier = GlanceModifier.defaultWeight())
                    Text(
                        text = "$month/$dayOfMonth 週$currentWeekday",
                        style = TextStyle(
                            color = ColorProvider(WidgetColors.SecondaryText),
                            fontSize = 11.sp
                        )
                    )
                }

                Spacer(modifier = GlanceModifier.height(4.dp))

                // 2. 2D 功課表矩陣 (左側時間節次欄 + 星期各欄)
                Row(
                    modifier = GlanceModifier.fillMaxWidth().defaultWeight()
                ) {
                    // A. 左側時間欄 (Time Column) - 簡寫省空間
                    Column(
                        modifier = GlanceModifier.width(28.dp).fillMaxHeight(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        // 時間欄標題
                        Box(
                            modifier = GlanceModifier.width(28.dp).height(headerRowHeight),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "節",
                                style = TextStyle(
                                    color = ColorProvider(WidgetColors.SecondaryText),
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            )
                        }

                        Spacer(modifier = GlanceModifier.height(gap))

                        displayPeriods.forEachIndexed { idx, p ->
                            val def = NTUPeriods.DEFS[p]
                            Column(
                                modifier = GlanceModifier
                                    .width(28.dp)
                                    .height(rowHeight)
                                    .background(ColorProvider(WidgetColors.CardBg))
                                    .cornerRadius(4.dp)
                                    .padding(vertical = 1.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = p,
                                    style = TextStyle(
                                        color = ColorProvider(WidgetColors.AccentGlow),
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                )
                                if (def != null && rowHeight >= 24.dp) {
                                    val shortTime = def.time.replace("^0".toRegex(), "")
                                    Text(
                                        text = shortTime,
                                        style = TextStyle(
                                            color = ColorProvider(WidgetColors.SecondaryText),
                                            fontSize = 7.sp
                                        )
                                    )
                                }
                            }
                            if (idx < displayPeriods.size - 1) {
                                Spacer(modifier = GlanceModifier.height(gap))
                            }
                        }
                    }

                    Spacer(modifier = GlanceModifier.width(4.dp))

                    // B. 星期各欄 (週一至週五)
                    schoolDays.forEachIndexed { dayIdx, day ->
                        val isToday = (day == currentWeekday)
                        val dayCourses = weekSchedule[day] ?: emptyList()

                        Column(
                            modifier = GlanceModifier.defaultWeight().fillMaxHeight(),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            // 星期標題 (MON/TUE/WED...)
                            Box(
                                modifier = GlanceModifier
                                    .fillMaxWidth()
                                    .height(headerRowHeight)
                                    .background(
                                        ColorProvider(if (isToday) WidgetColors.TodayBadge else WidgetColors.CardBg)
                                    )
                                    .cornerRadius(4.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                val enDay = NTUPeriods.WEEKDAYS_EN[day] ?: day
                                Text(
                                    text = if (isToday) "$enDay ●" else enDay,
                                    style = TextStyle(
                                        color = ColorProvider(if (isToday) WidgetColors.PrimaryText else WidgetColors.SecondaryText),
                                        fontSize = 9.5.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                )
                            }

                            Spacer(modifier = GlanceModifier.height(gap))

                            // 依照節次填入課程區塊或空白網格
                            var i = 0
                            while (i < displayPeriods.size) {
                                val p = displayPeriods[i]
                                val course = dayCourses.find { it.firstPeriod == p }

                                if (course != null) {
                                    val covered = displayPeriods.filter { dp ->
                                        val dpIdx = NTUPeriods.ORDER.indexOf(dp)
                                        dpIdx >= NTUPeriods.ORDER.indexOf(course.firstPeriod) &&
                                                dpIdx <= NTUPeriods.ORDER.indexOf(course.lastPeriod)
                                    }
                                    val span = maxOf(1, covered.size)
                                    val cardHeight = (rowHeight.value * span + gap.value * (span - 1)).dp
                                    val theme = WidgetColors.getCourseTheme(course.course.name)

                                    Column(
                                        modifier = GlanceModifier
                                            .fillMaxWidth()
                                            .height(cardHeight)
                                            .background(ColorProvider(theme.bg))
                                            .cornerRadius(5.dp)
                                            .padding(horizontal = 2.dp, vertical = 2.dp)
                                    ) {
                                        Text(
                                            text = course.course.name,
                                            style = TextStyle(
                                                color = ColorProvider(theme.text),
                                                fontSize = if (span >= 2) 9.sp else 8.sp,
                                                fontWeight = FontWeight.Bold
                                            ),
                                            maxLines = if (span >= 3) 3 else (if (span >= 2) 2 else 1)
                                        )
                                        if (span >= 2 && course.location.isNotBlank()) {
                                            Text(
                                                text = "📍${course.location}",
                                                style = TextStyle(
                                                    color = ColorProvider(theme.sub),
                                                    fontSize = 7.sp
                                                ),
                                                maxLines = 1
                                            )
                                        }
                                    }

                                    i += span
                                } else {
                                    // 空白格
                                    Box(
                                        modifier = GlanceModifier
                                            .fillMaxWidth()
                                            .height(rowHeight)
                                            .background(
                                                ColorProvider(
                                                    if (isToday) WidgetColors.CardHighlight else WidgetColors.CardBg.copy(alpha = 0.3f)
                                                )
                                            )
                                            .cornerRadius(4.dp)
                                    ) {}
                                    i += 1
                                }

                                if (i < displayPeriods.size) {
                                    Spacer(modifier = GlanceModifier.height(gap))
                                }
                            }
                        }

                        if (dayIdx < schoolDays.size - 1) {
                            Spacer(modifier = GlanceModifier.width(3.dp))
                        }
                    }
                }
            }
        }
    }
}

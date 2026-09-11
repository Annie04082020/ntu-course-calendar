package tw.edu.ntu.coursecalendar.widget

import android.content.Context
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.LocalSize
import androidx.glance.action.actionStartActivity
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.SizeMode
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

    override val sizeMode = SizeMode.Exact

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

        val hasWeekend = (weekSchedule["六"]?.isNotEmpty() == true) || (weekSchedule["日"]?.isNotEmpty() == true)
        val schoolDays = if (hasWeekend) listOf("一", "二", "三", "四", "五", "六") else listOf("一", "二", "三", "四", "五")

        provideContent {
            val size = LocalSize.current
            val widgetWidth = if (size.width > 50.dp) size.width else 340.dp
            val widgetHeight = if (size.height > 50.dp) size.height else 240.dp

            val padding = 6.dp
            val timeColWidth = 22.dp
            val dayGap = 2.dp
            val timeGap = 3.dp

            // 依可用寬度等分各星期欄位，確保週一至週五皆可100%完整呈現
            val numDays = schoolDays.size
            val rawAvailDayWidth = widgetWidth - (padding * 2) - timeColWidth - timeGap - (dayGap * (numDays - 1))
            val availDayWidth = if (rawAvailDayWidth > 100.dp) rawAvailDayWidth else (30.dp * numDays)
            val dayColWidth = availDayWidth / numDays

            // 依可用高度等分各節次高度，確保第 1 至 8 節完整收納且隨微件縮放自動填滿
            val titleRowHeight = 18.dp
            val headerRowHeight = 16.dp
            val periodGap = if (numPeriods >= 9) 1.dp else 2.dp
            val rawAvailGridHeight = widgetHeight - (padding * 2) - titleRowHeight - 3.dp - headerRowHeight - 2.dp
            val availGridHeight = if (rawAvailGridHeight > 60.dp) rawAvailGridHeight else (18.dp * numPeriods)
            val rowHeight = (availGridHeight - (periodGap * (numPeriods - 1))) / numPeriods

            Column(
                modifier = GlanceModifier
                    .fillMaxSize()
                    .background(WidgetColors.BgStart)
                    .cornerRadius(16.dp)
                    .padding(padding)
                    .clickable(actionStartActivity<MainActivity>())
            ) {
                // 1. 頂部標題列
                Row(
                    modifier = GlanceModifier.fillMaxWidth().height(titleRowHeight),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "📅 臺大週課表",
                        style = TextStyle(
                            color = ColorProvider(WidgetColors.Accent),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    )
                    Spacer(modifier = GlanceModifier.defaultWeight())
                    Text(
                        text = "$month/$dayOfMonth 週$currentWeekday",
                        style = TextStyle(
                            color = ColorProvider(WidgetColors.SecondaryText),
                            fontSize = 10.sp
                        )
                    )
                }

                Spacer(modifier = GlanceModifier.height(3.dp))

                // 2. 2D 功課表矩陣 (左側時間節次欄 + 星期各欄)
                Row(
                    modifier = GlanceModifier.fillMaxWidth().defaultWeight()
                ) {
                    // A. 左側時間欄 (Time Column) - 簡寫省空間
                    Column(
                        modifier = GlanceModifier.width(timeColWidth).fillMaxHeight(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        // 時間欄標題
                        Box(
                            modifier = GlanceModifier.width(timeColWidth).height(headerRowHeight),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "節",
                                style = TextStyle(
                                    color = ColorProvider(WidgetColors.SecondaryText),
                                    fontSize = 8.5.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            )
                        }

                        Spacer(modifier = GlanceModifier.height(periodGap))

                        displayPeriods.forEachIndexed { idx, p ->
                            val def = NTUPeriods.DEFS[p]
                            Column(
                                modifier = GlanceModifier
                                    .width(timeColWidth)
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
                                        fontSize = 8.5.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                )
                                if (def != null && rowHeight >= 22.dp) {
                                    val shortTime = def.time.replace("^0".toRegex(), "")
                                    Text(
                                        text = shortTime,
                                        style = TextStyle(
                                            color = ColorProvider(WidgetColors.SecondaryText),
                                            fontSize = 6.sp
                                        )
                                    )
                                }
                            }
                            if (idx < displayPeriods.size - 1) {
                                Spacer(modifier = GlanceModifier.height(periodGap))
                            }
                        }
                    }

                    Spacer(modifier = GlanceModifier.width(timeGap))

                    // B. 星期各欄 (週一至週五)
                    schoolDays.forEachIndexed { dayIdx, day ->
                        val isToday = (day == currentWeekday)
                        val dayCourses = weekSchedule[day] ?: emptyList()

                        Column(
                            modifier = GlanceModifier.width(dayColWidth).fillMaxHeight(),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            // 星期標題 (MON/TUE/WED/THU/FRI)
                            Box(
                                modifier = GlanceModifier
                                    .width(dayColWidth)
                                    .height(headerRowHeight)
                                    .background(
                                        ColorProvider(if (isToday) WidgetColors.TodayBadge else WidgetColors.CardBg)
                                    )
                                    .cornerRadius(4.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                val enDay = NTUPeriods.WEEKDAYS_EN[day] ?: day
                                Text(
                                    text = if (isToday) "$enDay●" else enDay,
                                    style = TextStyle(
                                        color = ColorProvider(if (isToday) WidgetColors.PrimaryText else WidgetColors.SecondaryText),
                                        fontSize = 8.5.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                )
                            }

                            Spacer(modifier = GlanceModifier.height(periodGap))

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
                                    val cardHeight = (rowHeight * span) + (periodGap * (span - 1))
                                    val theme = WidgetColors.getCourseTheme(course.course.name)

                                    Column(
                                        modifier = GlanceModifier
                                            .width(dayColWidth)
                                            .height(cardHeight)
                                            .background(ColorProvider(theme.bg))
                                            .cornerRadius(5.dp)
                                            .padding(horizontal = 2.dp, vertical = 2.dp)
                                    ) {
                                        Text(
                                            text = course.course.name,
                                            style = TextStyle(
                                                color = ColorProvider(theme.text),
                                                fontSize = if (span >= 2) 8.5.sp else 7.5.sp,
                                                fontWeight = FontWeight.Bold
                                            ),
                                            maxLines = if (span >= 3) 3 else (if (span >= 2) 2 else 1)
                                        )
                                        if (span >= 2 && course.location.isNotBlank() && rowHeight >= 18.dp) {
                                            Text(
                                                text = "📍${course.location.take(8)}",
                                                style = TextStyle(
                                                    color = ColorProvider(theme.sub),
                                                    fontSize = 6.5.sp
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
                                            .width(dayColWidth)
                                            .height(rowHeight)
                                            .background(
                                                ColorProvider(
                                                    if (isToday) WidgetColors.CardHighlight else WidgetColors.CardBg.copy(alpha = 0.25f)
                                                )
                                            )
                                            .cornerRadius(4.dp)
                                    ) {}
                                    i += 1
                                }

                                if (i < displayPeriods.size) {
                                    Spacer(modifier = GlanceModifier.height(periodGap))
                                }
                            }
                        }

                        if (dayIdx < schoolDays.size - 1) {
                            Spacer(modifier = GlanceModifier.width(dayGap))
                        }
                    }
                }
            }
        }
    }
}

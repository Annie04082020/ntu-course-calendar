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
import tw.edu.ntu.coursecalendar.data.ScheduledCourse
import java.util.*

class TodayGlanceWidget : GlanceAppWidget() {

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val repo = CourseRepository(context)
        val courses = repo.getCourses()
        val weekSchedule = CourseParser.buildWeekSchedule(courses)

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
        val currentMinutes = calendar.get(Calendar.HOUR_OF_DAY) * 60 + calendar.get(Calendar.MINUTE)

        val todayCourses = weekSchedule[currentWeekday] ?: emptyList()

        var currentCourse: ScheduledCourse? = null
        var nextCourse: ScheduledCourse? = null

        for (c in todayCourses) {
            if (currentMinutes in c.startMin..c.endMin) {
                currentCourse = c
                break
            } else if (currentMinutes < c.startMin) {
                if (nextCourse == null || c.startMin < nextCourse.startMin) {
                    nextCourse = c
                }
            }
        }

        val targetCourse = currentCourse ?: nextCourse

        provideContent {
            Row(
                modifier = GlanceModifier
                    .fillMaxSize()
                    .background(WidgetColors.BgStart)
                    .cornerRadius(16.dp)
                    .padding(12.dp)
                    .clickable(actionStartActivity<MainActivity>()),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // 左側：焦點區塊
                Column(
                    modifier = GlanceModifier.defaultWeight().fillMaxHeight(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "週$currentWeekday · 課表焦點",
                        style = TextStyle(
                            color = ColorProvider(WidgetColors.SecondaryText),
                            fontSize = 11.sp
                        )
                    )

                    Spacer(modifier = GlanceModifier.height(4.dp))

                    if (targetCourse != null) {
                        val isNow = (currentCourse != null)
                        Text(
                            text = if (isNow) "📍 上課中" else "⏳ 下一堂課",
                            style = TextStyle(
                                color = ColorProvider(if (isNow) WidgetColors.Warning else WidgetColors.AccentGlow),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        )
                        Spacer(modifier = GlanceModifier.height(2.dp))
                        Text(
                            text = targetCourse.course.name,
                            style = TextStyle(
                                color = ColorProvider(WidgetColors.PrimaryText),
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                            ),
                            maxLines = 1
                        )
                        Spacer(modifier = GlanceModifier.height(2.dp))
                        Text(
                            text = "📍 ${targetCourse.location}",
                            style = TextStyle(
                                color = ColorProvider(WidgetColors.PrimaryText),
                                fontSize = 11.sp
                            ),
                            maxLines = 1
                        )
                        Text(
                            text = "⏰ ${targetCourse.startTimeText} - ${targetCourse.endTimeText}",
                            style = TextStyle(
                                color = ColorProvider(WidgetColors.SecondaryText),
                                fontSize = 10.sp
                            )
                        )
                    } else if (todayCourses.isNotEmpty()) {
                        Text(
                            text = "🎉 今日課程",
                            style = TextStyle(
                                color = ColorProvider(WidgetColors.Success),
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                            )
                        )
                        Text(
                            text = "已全部結束！好好放鬆。",
                            style = TextStyle(
                                color = ColorProvider(WidgetColors.SecondaryText),
                                fontSize = 11.sp
                            )
                        )
                    } else {
                        Text(
                            text = "☕ 今日無課",
                            style = TextStyle(
                                color = ColorProvider(WidgetColors.Accent),
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                            )
                        )
                        Text(
                            text = "享受美好自由時光！",
                            style = TextStyle(
                                color = ColorProvider(WidgetColors.SecondaryText),
                                fontSize = 11.sp
                            )
                        )
                    }
                }

                // 分隔線
                Box(
                    modifier = GlanceModifier
                        .width(1.dp)
                        .fillMaxHeight()
                        .background(ColorProvider(WidgetColors.Border))
                ) {}

                Spacer(modifier = GlanceModifier.width(10.dp))

                // 右側：今日課表列表
                Column(
                    modifier = GlanceModifier.defaultWeight().fillMaxHeight(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "今日課表行程",
                        style = TextStyle(
                            color = ColorProvider(WidgetColors.PrimaryText),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    )

                    Spacer(modifier = GlanceModifier.height(4.dp))

                    if (todayCourses.isEmpty()) {
                        Text(
                            text = "今天沒有排定的課程～",
                            style = TextStyle(
                                color = ColorProvider(WidgetColors.SecondaryText),
                                fontSize = 10.sp
                            )
                        )
                    } else {
                        todayCourses.take(3).forEachIndexed { idx, c ->
                            val isCurrent = (currentCourse?.course?.name == c.course.name)
                            val isPast = (currentMinutes > c.endMin)

                            Row(
                                modifier = GlanceModifier
                                    .fillMaxWidth()
                                    .background(
                                        ColorProvider(
                                            if (isCurrent) WidgetColors.CardHighlight else WidgetColors.CardBg
                                        )
                                    )
                                    .cornerRadius(4.dp)
                                    .padding(horizontal = 4.dp, vertical = 2.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = c.startTimeText,
                                    style = TextStyle(
                                        color = ColorProvider(if (isCurrent) WidgetColors.AccentGlow else WidgetColors.Accent),
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                )
                                Spacer(modifier = GlanceModifier.width(6.dp))
                                Text(
                                    text = c.course.name,
                                    style = TextStyle(
                                        color = ColorProvider(if (isPast) WidgetColors.SecondaryText else WidgetColors.PrimaryText),
                                        fontSize = 10.5.sp
                                    ),
                                    maxLines = 1
                                )
                            }
                            if (idx < minOf(2, todayCourses.size - 1)) {
                                Spacer(modifier = GlanceModifier.height(3.dp))
                            }
                        }
                    }
                }
            }
        }
    }
}

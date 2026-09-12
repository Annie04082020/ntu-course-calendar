package tw.edu.ntu.coursecalendar.widget

import android.content.Context
import android.graphics.*
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import android.text.TextUtils
import tw.edu.ntu.coursecalendar.data.Course
import tw.edu.ntu.coursecalendar.data.NTUPeriods
import tw.edu.ntu.coursecalendar.data.ScheduledCourse
import java.util.*

object TimetableBitmapRenderer {

    // Maximum safe pixels dynamically balances ultra-crisp high-DPI clarity with Android AppWidget memory budget.
    // At 850,000 pixels (ARGB_8888 ~ 3.4 MB), the bitmap renders at 2.2x~2.6x Retina-level resolution,
    // ensuring sharp vector-like text without blurriness while reliably staying within system launcher limits.
    private const val MAX_SAFE_PIXELS = 850_000.0

    fun render(
        context: Context,
        courses: List<Course>,
        weekSchedule: Map<String, List<ScheduledCourse>>,
        widthPx: Int,
        heightPx: Int
    ): Bitmap {
        val deviceDensity = context.resources.displayMetrics.density.coerceAtLeast(1f)
        return render(
            context = context,
            courses = courses,
            weekSchedule = weekSchedule,
            widthDp = widthPx / deviceDensity,
            heightDp = heightPx / deviceDensity
        )
    }

    fun render(
        context: Context,
        courses: List<Course>,
        weekSchedule: Map<String, List<ScheduledCourse>>,
        widthDp: Float,
        heightDp: Float
    ): Bitmap {
        val rawW = maxOf(320f, widthDp)
        val rawH = maxOf(220f, heightDp)
        val totalArea = rawW.toDouble() * rawH.toDouble()

        // Calculate dynamic scale factor: up to 2.6x for crystal-clear text on Retina / High-DPI screens
        val maxAllowedScale = 2.6f
        val budgetScale = Math.sqrt(MAX_SAFE_PIXELS / totalArea).toFloat()
        val scale = minOf(maxAllowedScale, budgetScale).coerceAtLeast(1.2f)

        val w = (rawW * scale).toInt().coerceAtLeast(320)
        val h = (rawH * scale).toInt().coerceAtLeast(220)

        val bitmap = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)

        // Enable subpixel text and high quality bitmap filtering for ultra-crisp rendering
        canvas.drawFilter = PaintFlagsDrawFilter(
            0,
            Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG or Paint.SUBPIXEL_TEXT_FLAG
        )

        // Internal rendering density matches the bitmap scaling
        val density = scale

        // 1. 計算星期與節次
        val calendar = Calendar.getInstance()
        val currentWeekday = when (calendar.get(Calendar.DAY_OF_WEEK)) {
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
        val numDays = schoolDays.size

        // 2. 幾何尺寸計算
        val pad = 8f * density
        val titleH = 20f * density
        val headH = 18f * density
        val timeW = 24f * density
        val dayGap = 3f * density
        val timeGap = 4f * density
        val periodGap = if (numPeriods >= 9) 2f * density else 2.5f * density

        val availW = w - (pad * 2) - timeW - timeGap - ((numDays - 1) * dayGap)
        val dayW = availW / numDays

        val availH = h - (pad * 2) - titleH - (4f * density) - headH - periodGap
        val rowH = (availH - ((numPeriods - 1) * periodGap)) / numPeriods

        // 3. 繪製背景 (微件深色圓角卡片)
        val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = 0xFF141824.toInt()
            style = Paint.Style.FILL
            isDither = true
        }
        val cornerRadius = 16f * density
        canvas.drawRoundRect(RectF(0f, 0f, w.toFloat(), h.toFloat()), cornerRadius, cornerRadius, bgPaint)

        // 4. 頂部標題列
        val titlePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = 0xFF60A5FA.toInt() // Accent blue
            textSize = 12f * density
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            isSubpixelText = true
        }
        val titleY = pad + (titleH * 0.75f)
        canvas.drawText("📅 臺大週課表", pad + 4f * density, titleY, titlePaint)

        val datePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = 0xFF94A3B8.toInt()
            textSize = 10.5f * density
            textAlign = Paint.Align.RIGHT
            isSubpixelText = true
        }
        canvas.drawText("$month/$dayOfMonth 週$currentWeekday", w - pad - 4f * density, titleY, datePaint)

        // 5. 左側時間軸標題格 ("節")
        val gridTop = pad + titleH + (4f * density)
        val cellBgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = 0xFF1E2433.toInt()
            style = Paint.Style.FILL
            isDither = true
        }
        val textCenterPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            textAlign = Paint.Align.CENTER
            isSubpixelText = true
        }

        val timeHeaderRect = RectF(pad, gridTop, pad + timeW, gridTop + headH)
        canvas.drawRoundRect(timeHeaderRect, 4f * density, 4f * density, cellBgPaint)

        textCenterPaint.color = 0xFF94A3B8.toInt()
        textCenterPaint.textSize = 9f * density
        textCenterPaint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        val headBaseline = timeHeaderRect.centerY() - (textCenterPaint.descent() + textCenterPaint.ascent()) / 2f
        canvas.drawText("節", timeHeaderRect.centerX(), headBaseline, textCenterPaint)

        // 6. 左側時間軸各節次 (1 至 8 節完整收錄)
        val contentTop = gridTop + headH + periodGap
        for (i in 0 until numPeriods) {
            val p = displayPeriods[i]
            val def = NTUPeriods.DEFS[p]
            val top = contentTop + i * (rowH + periodGap)
            val rect = RectF(pad, top, pad + timeW, top + rowH)
            canvas.drawRoundRect(rect, 4f * density, 4f * density, cellBgPaint)

            // 節次名稱 (e.g. 1, 2, 3...)
            textCenterPaint.color = 0xFF38BDF8.toInt() // Accent glow
            textCenterPaint.textSize = if (rowH >= 24f * density) 9f * density else 8f * density
            textCenterPaint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)

            val showTime = (def != null && rowH >= 20f * density)
            val pY = if (showTime) rect.centerY() - 2f * density else rect.centerY() - (textCenterPaint.descent() + textCenterPaint.ascent()) / 2f
            canvas.drawText(p, rect.centerX(), pY, textCenterPaint)

            if (showTime && def != null) {
                textCenterPaint.color = 0xFF94A3B8.toInt()
                textCenterPaint.textSize = 6.2f * density
                textCenterPaint.typeface = Typeface.DEFAULT
                val shortTime = def.time.replace("^0".toRegex(), "")
                canvas.drawText(shortTime, rect.centerX(), pY + (8.5f * density), textCenterPaint)
            }
        }

        // 7. 星期欄位與課程卡片 (週一至週五 100% 完整排入)
        val startX = pad + timeW + timeGap
        val strokePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.STROKE
            strokeWidth = 1f * density
        }

        for (dayIdx in 0 until numDays) {
            val day = schoolDays[dayIdx]
            val isToday = (day == currentWeekday)
            val dayLeft = startX + dayIdx * (dayW + dayGap)
            val dayRight = dayLeft + dayW

            // A. 頂部星期標題 (MON / TUE / WED / THU / FRI)
            val headerRect = RectF(dayLeft, gridTop, dayRight, gridTop + headH)
            cellBgPaint.color = if (isToday) 0xFF2563EB.toInt() else 0xFF1E2433.toInt()
            canvas.drawRoundRect(headerRect, 4f * density, 4f * density, cellBgPaint)

            val enDay = NTUPeriods.WEEKDAYS_EN[day] ?: day
            textCenterPaint.color = if (isToday) Color.WHITE else 0xFF94A3B8.toInt()
            textCenterPaint.textSize = 9f * density
            textCenterPaint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            val enText = if (isToday) "$enDay●" else enDay
            canvas.drawText(enText, headerRect.centerX(), headBaseline, textCenterPaint)

            // B. 節次網格與課程卡片
            val dayCourses = weekSchedule[day] ?: emptyList()
            var pIdx = 0
            while (pIdx < numPeriods) {
                val p = displayPeriods[pIdx]
                val course = dayCourses.find { it.firstPeriod == p }
                val top = contentTop + pIdx * (rowH + periodGap)

                if (course != null) {
                    val covered = displayPeriods.filter { dp ->
                        val dpIndex = NTUPeriods.ORDER.indexOf(dp)
                        dpIndex >= NTUPeriods.ORDER.indexOf(course.firstPeriod) &&
                                dpIndex <= NTUPeriods.ORDER.indexOf(course.lastPeriod)
                    }
                    val span = maxOf(1, covered.size)
                    val cardH = (span * rowH) + ((span - 1) * periodGap)
                    val bottom = top + cardH
                    val cardRect = RectF(dayLeft, top, dayRight, bottom)

                    val theme = WidgetColors.getCourseTheme(course.course.name)

                    // 繪製卡片背景與邊框
                    val cardBgColor = Color.argb(
                        (theme.bg.alpha * 255).toInt(),
                        (theme.bg.red * 255).toInt(),
                        (theme.bg.green * 255).toInt(),
                        (theme.bg.blue * 255).toInt()
                    )
                    cellBgPaint.color = cardBgColor
                    canvas.drawRoundRect(cardRect, 5f * density, 5f * density, cellBgPaint)

                    val cardBorderColor = Color.argb(
                        (theme.border.alpha * 255).toInt(),
                        (theme.border.red * 255).toInt(),
                        (theme.border.green * 255).toInt(),
                        (theme.border.blue * 255).toInt()
                    )
                    strokePaint.color = cardBorderColor
                    canvas.drawRoundRect(cardRect, 5f * density, 5f * density, strokePaint)

                    // 繪製課程文字 (使用 StaticLayout 確保中文字串自動折行、不超框)
                    val textColor = Color.argb(
                        (theme.text.alpha * 255).toInt(),
                        (theme.text.red * 255).toInt(),
                        (theme.text.green * 255).toInt(),
                        (theme.text.blue * 255).toInt()
                    )
                    val textPaint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
                        color = textColor
                        textSize = if (span >= 2) 8.5f * density else 7.5f * density
                        typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
                        isSubpixelText = true
                    }

                    val innerPadX = 3f * density
                    val innerPadY = 3f * density
                    val maxTextW = maxOf(10, (dayW - innerPadX * 2).toInt())

                    val maxLines = when {
                        cardH >= 70f * density -> 4
                        cardH >= 48f * density || span >= 3 -> 3
                        cardH >= 32f * density || span >= 2 -> 2
                        else -> 1
                    }

                    val isEnglish = CourseRepository(context).isEnglish()
                    val displayName = course.course.getDisplayName(isEnglish)

                    val titleLayout = StaticLayout.Builder.obtain(
                        displayName,
                        0,
                        displayName.length,
                        textPaint,
                        maxTextW
                    )
                        .setAlignment(Layout.Alignment.ALIGN_NORMAL)
                        .setMaxLines(maxLines)
                        .setEllipsize(TextUtils.TruncateAt.END)
                        .build()

                    canvas.save()
                    canvas.translate(dayLeft + innerPadX, top + innerPadY)
                    titleLayout.draw(canvas)
                    canvas.restore()

                    // 地點標籤 (若垂直高度足夠或跨節，顯示教室位置)
                    if (course.location.isNotBlank() && (cardH >= 36f * density || span >= 2)) {
                        val subColor = Color.argb(
                            (theme.sub.alpha * 255).toInt(),
                            (theme.sub.red * 255).toInt(),
                            (theme.sub.green * 255).toInt(),
                            (theme.sub.blue * 255).toInt()
                        )
                        val locPaint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
                            color = subColor
                            textSize = 6.8f * density
                            typeface = Typeface.DEFAULT
                            isSubpixelText = true
                        }
                        val locText = "📍${course.location.take(8)}"
                        val locLayout = StaticLayout.Builder.obtain(
                            locText,
                            0,
                            locText.length,
                            locPaint,
                            maxTextW
                        )
                            .setAlignment(Layout.Alignment.ALIGN_NORMAL)
                            .setMaxLines(1)
                            .setEllipsize(TextUtils.TruncateAt.END)
                            .build()

                        canvas.save()
                        val locY = top + innerPadY + titleLayout.height + (1f * density)
                        if (locY + locLayout.height <= bottom - innerPadY) {
                            canvas.translate(dayLeft + innerPadX, locY)
                            locLayout.draw(canvas)
                        }
                        canvas.restore()
                    }

                    pIdx += span
                } else {
                    // 空白網格
                    val rect = RectF(dayLeft, top, dayRight, top + rowH)
                    cellBgPaint.color = if (isToday) 0x1A3B82F6.toInt() else 0x0DFFFFFF.toInt()
                    canvas.drawRoundRect(rect, 4f * density, 4f * density, cellBgPaint)

                    strokePaint.color = if (isToday) 0x333B82F6.toInt() else 0x1AFFFFFF.toInt()
                    canvas.drawRoundRect(rect, 4f * density, 4f * density, strokePaint)

                    pIdx += 1
                }
            }
        }

        return bitmap
    }
}

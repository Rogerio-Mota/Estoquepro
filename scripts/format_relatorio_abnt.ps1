param(
    [string]$InputPath = "docs\RELATORIO_VALIDACAO_COMUNIDADE.docx",
    [string]$OutputPath = "docs\RELATORIO_VALIDACAO_COMUNIDADE_ABNT.docx"
)

$ErrorActionPreference = "Stop"

function Resolve-AbsolutePath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if ([System.IO.Path]::IsPathRooted($Path)) {
        return $Path
    }

    return [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $Path))
}

function Set-StyleFormatting {
    param(
        [Parameter(Mandatory = $true)]
        $Style,
        [Parameter(Mandatory = $true)]
        $Word,
        [Parameter(Mandatory = $true)]
        [int]$Alignment,
        [double]$FontSize = 12,
        [bool]$Bold = $false,
        [double]$FirstLineIndentCm = 1.25,
        [double]$SpaceBeforePt = 0,
        [double]$SpaceAfterPt = 0,
        [int]$LineSpacingRule = 1,
        [bool]$PageBreakBefore = $false
    )

    $Style.Font.Name = "Times New Roman"
    $Style.Font.Size = $FontSize
    $Style.Font.Bold = [int]$Bold
    $Style.ParagraphFormat.Alignment = $Alignment
    $Style.ParagraphFormat.LineSpacingRule = $LineSpacingRule
    $Style.ParagraphFormat.SpaceBefore = $SpaceBeforePt
    $Style.ParagraphFormat.SpaceAfter = $SpaceAfterPt
    $Style.ParagraphFormat.LeftIndent = 0
    $Style.ParagraphFormat.RightIndent = 0
    $Style.ParagraphFormat.FirstLineIndent = $Word.CentimetersToPoints($FirstLineIndentCm)
    $Style.ParagraphFormat.PageBreakBefore = [int]$PageBreakBefore
}

$source = (Resolve-Path -LiteralPath $InputPath).Path
$target = Resolve-AbsolutePath -Path $OutputPath
$targetDirectory = Split-Path -Path $target -Parent

if (-not (Test-Path -LiteralPath $targetDirectory)) {
    New-Item -ItemType Directory -Path $targetDirectory | Out-Null
}

Copy-Item -LiteralPath $source -Destination $target -Force

$word = $null
$doc = $null

try {
    $wdPaperA4 = 7
    $wdStyleNormal = -1
    $wdStyleHeading1 = -2
    $wdStyleHeading2 = -3
    $wdStyleHeading3 = -4
    $wdAlignParagraphLeft = 0
    $wdAlignParagraphCenter = 1
    $wdAlignParagraphJustify = 3
    $wdLineSpaceSingle = 0
    $wdLineSpace15 = 1
    $wdSectionBreakNextPage = 2
    $wdCollapseStart = 1
    $wdHeaderFooterPrimary = 1
    $wdPageNumberAlignmentRight = 2

    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0

    $doc = $word.Documents.Open($target)

    $doc.PageSetup.PaperSize = $wdPaperA4
    $doc.PageSetup.TopMargin = $word.CentimetersToPoints(3)
    $doc.PageSetup.LeftMargin = $word.CentimetersToPoints(3)
    $doc.PageSetup.BottomMargin = $word.CentimetersToPoints(2)
    $doc.PageSetup.RightMargin = $word.CentimetersToPoints(2)
    $doc.PageSetup.HeaderDistance = $word.CentimetersToPoints(2)
    $doc.PageSetup.FooterDistance = $word.CentimetersToPoints(1.5)

    $doc.Content.Font.Name = "Times New Roman"
    $doc.Content.Font.Size = 12
    $doc.Content.ParagraphFormat.Alignment = $wdAlignParagraphJustify
    $doc.Content.ParagraphFormat.LineSpacingRule = $wdLineSpace15
    $doc.Content.ParagraphFormat.SpaceBefore = 0
    $doc.Content.ParagraphFormat.SpaceAfter = 0
    $doc.Content.ParagraphFormat.LeftIndent = 0
    $doc.Content.ParagraphFormat.RightIndent = 0
    $doc.Content.ParagraphFormat.FirstLineIndent = $word.CentimetersToPoints(1.25)

    Set-StyleFormatting -Style $doc.Styles.Item($wdStyleNormal) -Word $word -Alignment $wdAlignParagraphJustify

    try {
        $webNormalStyle = $doc.Styles.Item("Normal (Web)")
        Set-StyleFormatting -Style $webNormalStyle -Word $word -Alignment $wdAlignParagraphJustify
    } catch {
    }

    Set-StyleFormatting -Style $doc.Styles.Item($wdStyleHeading1) -Word $word -Alignment $wdAlignParagraphCenter -Bold $true -FirstLineIndentCm 0 -SpaceAfterPt 18
    Set-StyleFormatting -Style $doc.Styles.Item($wdStyleHeading2) -Word $word -Alignment $wdAlignParagraphLeft -Bold $true -FirstLineIndentCm 0 -SpaceAfterPt 18 -PageBreakBefore $true
    Set-StyleFormatting -Style $doc.Styles.Item($wdStyleHeading3) -Word $word -Alignment $wdAlignParagraphLeft -Bold $true -FirstLineIndentCm 0 -SpaceBeforePt 18 -SpaceAfterPt 18

    if ($doc.Sections.Count -lt 2) {
        $textualStart = $doc.Paragraphs.Item(8).Range.Duplicate
        $textualStart.Collapse($wdCollapseStart)
        $textualStart.InsertBreak($wdSectionBreakNextPage)
    }

    $doc.Paragraphs.Item(1).Range.ParagraphFormat.Alignment = $wdAlignParagraphCenter
    $doc.Paragraphs.Item(1).Range.ParagraphFormat.FirstLineIndent = 0
    $doc.Paragraphs.Item(1).Range.Font.Bold = 1
    $doc.Paragraphs.Item(1).Range.Font.Size = 12

    $doc.Paragraphs.Item(2).Range.ParagraphFormat.Alignment = $wdAlignParagraphCenter
    $doc.Paragraphs.Item(2).Range.ParagraphFormat.FirstLineIndent = 0
    $doc.Paragraphs.Item(2).Range.Font.Size = 12
    $doc.Paragraphs.Item(2).Range.ParagraphFormat.SpaceAfter = 24

    foreach ($index in 3..7) {
        $paragraph = $doc.Paragraphs.Item($index).Range
        $paragraph.ParagraphFormat.Alignment = $wdAlignParagraphLeft
        $paragraph.ParagraphFormat.FirstLineIndent = 0
        $paragraph.ParagraphFormat.SpaceBefore = 0
        $paragraph.ParagraphFormat.SpaceAfter = 0
        $paragraph.ParagraphFormat.LineSpacingRule = $wdLineSpace15
    }

    $doc.Paragraphs.Item(7).Range.Font.Size = 10

    for ($i = 1; $i -le $doc.Paragraphs.Count; $i++) {
        $paragraphRange = $doc.Paragraphs.Item($i).Range
        if ($paragraphRange.ListFormat.ListType -ne 0) {
            $paragraphRange.ParagraphFormat.FirstLineIndent = 0
            $paragraphRange.ParagraphFormat.SpaceBefore = 0
            $paragraphRange.ParagraphFormat.SpaceAfter = 0
        }
    }

    foreach ($table in @($doc.Tables)) {
        $table.AutoFitBehavior(2)
        $table.Range.Font.Name = "Times New Roman"
        $table.Range.Font.Size = 10
        $table.Range.ParagraphFormat.Alignment = $wdAlignParagraphLeft
        $table.Range.ParagraphFormat.LineSpacingRule = $wdLineSpaceSingle
        $table.Range.ParagraphFormat.FirstLineIndent = 0
        $table.Range.ParagraphFormat.SpaceBefore = 0
        $table.Range.ParagraphFormat.SpaceAfter = 0
        $table.Rows.Item(1).Range.Font.Bold = 1
    }

    for ($sectionIndex = 1; $sectionIndex -le $doc.Sections.Count; $sectionIndex++) {
        $header = $doc.Sections.Item($sectionIndex).Headers.Item($wdHeaderFooterPrimary)
        $header.LinkToPrevious = $false
        if ($header.PageNumbers.Count -gt 0) {
            while ($header.PageNumbers.Count -gt 0) {
                $header.PageNumbers.Item(1).Delete()
            }
        }
    }

    if ($doc.Sections.Count -ge 2) {
        $pageNumbers = $doc.Sections.Item(2).Headers.Item($wdHeaderFooterPrimary).PageNumbers
        $pageNumbers.Add($wdPageNumberAlignmentRight, $true) | Out-Null
        $pageNumbers.RestartNumberingAtSection = $true
        $pageNumbers.StartingNumber = 1
    }

    $doc.Fields.Update() | Out-Null
    $doc.Save()
    $doc.Close([ref]$false)

    Write-Output $target
} finally {
    if ($doc -ne $null) {
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($doc) | Out-Null
    }

    if ($word -ne $null) {
        try {
            $word.Quit([ref]$false)
        } catch {
        }

        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
    }

    [gc]::Collect()
    [gc]::WaitForPendingFinalizers()
}

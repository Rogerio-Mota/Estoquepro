param(
    [string]$InputMarkdown = "docs\ATIVIDADE_LGPD_COMPLETA.md",
    [string]$OutputDocx = "docs\ATIVIDADE_LGPD_COMPLETA_ACADEMICA.docx",
    [string]$OutputPdf = "docs\ATIVIDADE_LGPD_COMPLETA_ACADEMICA.pdf"
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

function Ensure-ParentDirectory {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    $parent = Split-Path -Path $Path -Parent
    if (-not (Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Path $parent | Out-Null
    }
}

function Normalize-InlineMarkdown {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Text
    )

    $normalized = $Text -replace "`r", ""
    $normalized = $normalized -replace "\*\*", ""
    $normalized = $normalized.Replace([string][char]96, "")
    return $normalized.Trim()
}

function Convert-MarkdownToBlocks {
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string[]]$Lines
    )

    $blocks = New-Object System.Collections.Generic.List[object]
    $paragraphBuffer = New-Object System.Collections.Generic.List[string]
    $paragraphType = $null

    function Flush-Paragraph {
        param(
            [System.Collections.Generic.List[object]]$BlockList,
            [System.Collections.Generic.List[string]]$Buffer,
            [ref]$TypeRef
        )

        if ($Buffer.Count -eq 0) {
            $TypeRef.Value = $null
            return
        }

        $joinedText = $Buffer -join " "
        $joinedText = $joinedText.Trim()
        $text = Normalize-InlineMarkdown -Text $joinedText
        if ($text) {
            $BlockList.Add([pscustomobject]@{
                Type = $(if ($TypeRef.Value) { $TypeRef.Value } else { "paragraph" })
                Text = $text
            })
        }

        $Buffer.Clear()
        $TypeRef.Value = $null
    }

    foreach ($rawLine in $Lines) {
        $line = $rawLine -replace "`t", "    "
        $line = $line.TrimEnd()

        if (-not $line.Trim()) {
            Flush-Paragraph -BlockList $blocks -Buffer $paragraphBuffer -TypeRef ([ref]$paragraphType)
            continue
        }

        if ($line -match "^(#{1,6})\s+(.*)$") {
            Flush-Paragraph -BlockList $blocks -Buffer $paragraphBuffer -TypeRef ([ref]$paragraphType)
            $blocks.Add([pscustomobject]@{
                Type = "heading"
                Level = $matches[1].Length
                Text = (Normalize-InlineMarkdown -Text $matches[2])
            })
            continue
        }

        if ($line -match "^\-\s+(.*)$") {
            Flush-Paragraph -BlockList $blocks -Buffer $paragraphBuffer -TypeRef ([ref]$paragraphType)
            $blocks.Add([pscustomobject]@{
                Type = "bullet"
                Text = (Normalize-InlineMarkdown -Text $matches[1])
            })
            continue
        }

        if ($line -match "^\d+\.\s+(.*)$") {
            if ($paragraphType -ne "numbered") {
                Flush-Paragraph -BlockList $blocks -Buffer $paragraphBuffer -TypeRef ([ref]$paragraphType)
                $paragraphType = "numbered"
            }

            $paragraphBuffer.Add((Normalize-InlineMarkdown -Text $line))
            continue
        }

        if (-not $paragraphType) {
            $paragraphType = "paragraph"
        }

        $paragraphBuffer.Add($line.Trim())
    }

    Flush-Paragraph -BlockList $blocks -Buffer $paragraphBuffer -TypeRef ([ref]$paragraphType)
    return $blocks
}

function Set-ParagraphFormatting {
    param(
        [Parameter(Mandatory = $true)]
        $Selection,
        [Parameter(Mandatory = $true)]
        $Word,
        [string]$FontName = "Times New Roman",
        [double]$FontSize = 12,
        [bool]$Bold = $false,
        [int]$Alignment = 3,
        [double]$FirstLineIndentCm = 1.25,
        [double]$LeftIndentCm = 0,
        [double]$RightIndentCm = 0,
        [double]$SpaceBeforePt = 0,
        [double]$SpaceAfterPt = 0,
        [int]$LineSpacingRule = 1
    )

    $Selection.Font.Name = $FontName
    $Selection.Font.Size = $FontSize
    $Selection.Font.Bold = [int]$Bold
    $Selection.ParagraphFormat.Alignment = $Alignment
    $Selection.ParagraphFormat.LineSpacingRule = $LineSpacingRule
    $Selection.ParagraphFormat.SpaceBefore = $SpaceBeforePt
    $Selection.ParagraphFormat.SpaceAfter = $SpaceAfterPt
    $Selection.ParagraphFormat.LeftIndent = $Word.CentimetersToPoints($LeftIndentCm)
    $Selection.ParagraphFormat.RightIndent = $Word.CentimetersToPoints($RightIndentCm)
    $Selection.ParagraphFormat.FirstLineIndent = $Word.CentimetersToPoints($FirstLineIndentCm)
}

function Add-Paragraph {
    param(
        [Parameter(Mandatory = $true)]
        $Selection,
        [Parameter(Mandatory = $true)]
        $Word,
        [Parameter(Mandatory = $true)]
        [string]$Text,
        [double]$FontSize = 12,
        [bool]$Bold = $false,
        [int]$Alignment = 3,
        [double]$FirstLineIndentCm = 1.25,
        [double]$LeftIndentCm = 0,
        [double]$SpaceBeforePt = 0,
        [double]$SpaceAfterPt = 0,
        [int]$LineSpacingRule = 1
    )

    Set-ParagraphFormatting `
        -Selection $Selection `
        -Word $Word `
        -FontSize $FontSize `
        -Bold $Bold `
        -Alignment $Alignment `
        -FirstLineIndentCm $FirstLineIndentCm `
        -LeftIndentCm $LeftIndentCm `
        -SpaceBeforePt $SpaceBeforePt `
        -SpaceAfterPt $SpaceAfterPt `
        -LineSpacingRule $LineSpacingRule

    $Selection.TypeText($Text)
    $Selection.TypeParagraph()
}

function Add-CoverPage {
    param(
        [Parameter(Mandatory = $true)]
        $Selection,
        [Parameter(Mandatory = $true)]
        $Word
    )

    $wdAlignParagraphCenter = 1

    Add-Paragraph -Selection $Selection -Word $Word -Text "ATIVIDADE 12" -Bold $true -Alignment $wdAlignParagraphCenter -FirstLineIndentCm 0
    Add-Paragraph -Selection $Selection -Word $Word -Text "MODELAGEM DE SISTEMAS" -Bold $true -Alignment $wdAlignParagraphCenter -FirstLineIndentCm 0
    Add-Paragraph -Selection $Selection -Word $Word -Text "UNIDADE 5: GERENCIAMENTO E EVOLUCAO DA MODELAGEM DE SISTEMAS" -Bold $true -Alignment $wdAlignParagraphCenter -FirstLineIndentCm 0 -SpaceAfterPt 36

    1..6 | ForEach-Object { $Selection.TypeParagraph() }

    Add-Paragraph -Selection $Selection -Word $Word -Text "COMO A LGPD IMPACTA A MODELAGEM DE REQUISITOS, DADOS (DER) E CASOS DE USO (UML) DO SISTEMA ESTOQUEPRO" -Bold $true -Alignment $wdAlignParagraphCenter -FirstLineIndentCm 0 -SpaceAfterPt 24
    Add-Paragraph -Selection $Selection -Word $Word -Text "Projeto analisado: EstoquePro" -Alignment $wdAlignParagraphCenter -FirstLineIndentCm 0
    Add-Paragraph -Selection $Selection -Word $Word -Text "Professor: Cairo Borges" -Alignment $wdAlignParagraphCenter -FirstLineIndentCm 0
    Add-Paragraph -Selection $Selection -Word $Word -Text "Equipe: projeto EstoquePro" -Alignment $wdAlignParagraphCenter -FirstLineIndentCm 0

    1..10 | ForEach-Object { $Selection.TypeParagraph() }

    Add-Paragraph -Selection $Selection -Word $Word -Text (Get-Date -Format "yyyy") -Alignment $wdAlignParagraphCenter -FirstLineIndentCm 0
}

$sourceMarkdown = Resolve-AbsolutePath -Path $InputMarkdown
$targetDocx = Resolve-AbsolutePath -Path $OutputDocx
$targetPdf = Resolve-AbsolutePath -Path $OutputPdf

Ensure-ParentDirectory -Path $targetDocx
Ensure-ParentDirectory -Path $targetPdf

$markdownLines = Get-Content -LiteralPath $sourceMarkdown -Encoding UTF8
$blocks = Convert-MarkdownToBlocks -Lines $markdownLines

$word = $null
$doc = $null
$selection = $null

try {
    $wdPaperA4 = 7
    $wdFormatDocumentDefault = 16
    $wdExportFormatPDF = 17
    $wdSectionBreakNextPage = 2
    $wdAlignParagraphLeft = 0
    $wdAlignParagraphCenter = 1
    $wdAlignParagraphJustify = 3
    $wdLineSpace15 = 1
    $wdHeaderFooterPrimary = 1
    $wdPageNumberAlignmentRight = 2

    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0

    $doc = $word.Documents.Add()
    $selection = $word.Selection

    $doc.PageSetup.PaperSize = $wdPaperA4
    $doc.PageSetup.TopMargin = $word.CentimetersToPoints(3)
    $doc.PageSetup.LeftMargin = $word.CentimetersToPoints(3)
    $doc.PageSetup.BottomMargin = $word.CentimetersToPoints(2)
    $doc.PageSetup.RightMargin = $word.CentimetersToPoints(2)
    $doc.PageSetup.HeaderDistance = $word.CentimetersToPoints(2)
    $doc.PageSetup.FooterDistance = $word.CentimetersToPoints(1.5)

    Add-CoverPage -Selection $selection -Word $word
    $selection.InsertBreak($wdSectionBreakNextPage)

    foreach ($block in $blocks) {
        switch ($block.Type) {
            "heading" {
                if ($block.Level -le 2) {
                    Add-Paragraph `
                        -Selection $selection `
                        -Word $word `
                        -Text $block.Text `
                        -Bold $true `
                        -Alignment $wdAlignParagraphLeft `
                        -FirstLineIndentCm 0 `
                        -SpaceBeforePt 18 `
                        -SpaceAfterPt 12
                } else {
                    Add-Paragraph `
                        -Selection $selection `
                        -Word $word `
                        -Text $block.Text `
                        -Bold $true `
                        -Alignment $wdAlignParagraphLeft `
                        -FirstLineIndentCm 0 `
                        -SpaceBeforePt 12 `
                        -SpaceAfterPt 6
                }
            }
            "bullet" {
                Add-Paragraph `
                    -Selection $selection `
                    -Word $word `
                    -Text ("- " + $block.Text) `
                    -Alignment $wdAlignParagraphLeft `
                    -FirstLineIndentCm 0 `
                    -LeftIndentCm 1.25 `
                    -SpaceAfterPt 6
            }
            "numbered" {
                Add-Paragraph `
                    -Selection $selection `
                    -Word $word `
                    -Text $block.Text `
                    -Alignment $wdAlignParagraphLeft `
                    -FirstLineIndentCm 0 `
                    -LeftIndentCm 1.25 `
                    -SpaceAfterPt 6
            }
            default {
                Add-Paragraph `
                    -Selection $selection `
                    -Word $word `
                    -Text $block.Text `
                    -Alignment $wdAlignParagraphJustify `
                    -FirstLineIndentCm 1.25 `
                    -SpaceAfterPt 0
            }
        }
    }

    for ($sectionIndex = 1; $sectionIndex -le $doc.Sections.Count; $sectionIndex++) {
        $header = $doc.Sections.Item($sectionIndex).Headers.Item($wdHeaderFooterPrimary)
        $header.LinkToPrevious = $false
        while ($header.PageNumbers.Count -gt 0) {
            $header.PageNumbers.Item(1).Delete()
        }
    }

    if ($doc.Sections.Count -ge 2) {
        $pageNumbers = $doc.Sections.Item(2).Headers.Item($wdHeaderFooterPrimary).PageNumbers
        $pageNumbers.Add($wdPageNumberAlignmentRight, $true) | Out-Null
        $pageNumbers.RestartNumberingAtSection = $true
        $pageNumbers.StartingNumber = 1
    }

    $doc.Fields.Update() | Out-Null
    $doc.SaveAs([ref]$targetDocx, [ref]$wdFormatDocumentDefault)
    $doc.ExportAsFixedFormat($targetPdf, $wdExportFormatPDF)

    Write-Output "DOCX: $targetDocx"
    Write-Output "PDF: $targetPdf"
}
finally {
    if ($doc -ne $null) {
        try {
            $doc.Close([ref]$false)
        }
        catch {
        }

        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($doc) | Out-Null
    }

    if ($selection -ne $null) {
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($selection) | Out-Null
    }

    if ($word -ne $null) {
        try {
            $word.Quit([ref]$false)
        }
        catch {
        }

        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
    }

    [gc]::Collect()
    [gc]::WaitForPendingFinalizers()
}

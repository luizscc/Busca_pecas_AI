# Script para upload dos documentos de conhecimento

$baseUrl = "http://127.0.0.1:8787/upload-document"
$docs = @(
    @{
        file = "docs\knowledge-base\equivalences\komatsu-pc200-8-bombas.txt"
        category = "equivalences"
    },
    @{
        file = "docs\knowledge-base\ncm\componentes-hidraulicos.txt"
        category = "ncm"
    },
    @{
        file = "docs\knowledge-base\suppliers\fornecedores-china.txt"
        category = "suppliers"
    },
    @{
        file = "docs\knowledge-base\technical\komatsu-pc200-8-especificacoes.txt"
        category = "technical"
    }
)

foreach ($doc in $docs) {
    Write-Host "`n📤 Uploading: $($doc.file)" -ForegroundColor Cyan
    
    if (Test-Path $doc.file) {
        $content = Get-Content $doc.file -Raw -Encoding UTF8
        $filename = Split-Path $doc.file -Leaf
        
        $body = @{
            content = $content
            filename = $filename
            category = $doc.category
        } | ConvertTo-Json -Depth 10
        
        try {
            $response = Invoke-RestMethod -Uri $baseUrl -Method POST `
                -Body $body -ContentType "application/json; charset=utf-8" `
                -TimeoutSec 120
            
            if ($response.success) {
                Write-Host "✅ Sucesso! Chunks: $($response.chunks_count)" -ForegroundColor Green
            } else {
                Write-Host "❌ Erro: $($response.error)" -ForegroundColor Red
            }
        } catch {
            Write-Host "❌ Falha na requisição: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠️  Arquivo não encontrado!" -ForegroundColor Yellow
    }
    
    Start-Sleep -Seconds 2
}

Write-Host "`n✨ Upload concluído!" -ForegroundColor Green

<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../../config/database.php';

$idcli = $_GET['idcli'] ?? '';

if (!$idcli) {
    http_response_code(400);
    echo json_encode(['error' => 'ID client requis']);
    exit;
}

try {
    $db = Database::getConnection();
    
    $stmt = $db->prepare("
        SELECT 
            a.numachat,
            a.idcli,
            a.idvoit,
            a.date,
            a.qte,
            v.design,
            v.prix,
            (a.qte * v.prix) as total,
            c.nom as client_nom
        FROM achat a
        JOIN voiture v ON a.idvoit = v.idvoit
        JOIN client c ON a.idcli = c.idcli
        WHERE a.idcli = :idcli
        AND a.numachat NOT IN (
            SELECT numachat FROM ligne_facture
        )
        ORDER BY a.date DESC
    ");
    
    $stmt->execute([':idcli' => $idcli]);
    $achats = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($achats);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

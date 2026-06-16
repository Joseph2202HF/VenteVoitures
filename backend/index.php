<?php
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/database.php';

$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri    = str_replace('/backend', '', $uri);
$method = $_SERVER['REQUEST_METHOD'];
$parts  = explode('/', trim($uri, '/'));
$resource = $parts[0] ?? '';
$id       = $parts[1] ?? null;

$body = json_decode(file_get_contents('php://input'), true) ?? [];

require_once __DIR__ . '/controllers/ClientController.php';
require_once __DIR__ . '/controllers/VoitureController.php';
require_once __DIR__ . '/controllers/AchatController.php';
require_once __DIR__ . '/controllers/StatsController.php';
require_once __DIR__ . '/controllers/FactureController.php';

$db = Database::getConnection();

// Route spéciale : /achats/non-factures?idcli=XXX
if ($resource === 'achats' && $id === 'non-factures') {
    $idcli = $_GET['idcli'] ?? '';
    if (!$idcli) {
        http_response_code(400);
        echo json_encode(['error' => 'ID client requis']);
        exit;
    }
    $stmt = $db->prepare("
        SELECT a.numachat, a.idcli, a.idvoit, a.date, a.qte,
               v.design, v.prix, (a.qte * v.prix) as total,
               c.nom as client_nom
        FROM achat a
        JOIN voiture v ON a.idvoit = v.idvoit
        JOIN client c ON a.idcli = c.idcli
        WHERE a.idcli = :idcli
        AND a.numachat NOT IN (SELECT numachat FROM ligne_facture)
        ORDER BY a.date DESC
    ");
    $stmt->execute([':idcli' => $idcli]);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

switch ($resource) {
    case 'clients':
        ClientController::handle($method, $id, $body, $db); break;
    case 'voitures':
        VoitureController::handle($method, $id, $body, $db); break;
    case 'achats':
        AchatController::handle($method, $id, $body, $db); break;
    case 'factures':
        FactureController::handle($method, $id, $body, $db); break;
    case 'stats':
        StatsController::handle($method, $id, $body, $db); break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Route not found']);
}

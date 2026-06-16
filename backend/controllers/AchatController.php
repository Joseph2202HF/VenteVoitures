<?php
class AchatController {
    public static function handle(string $method, ?string $id, array $body, PDO $db): void {
        switch ($method) {
            case 'GET':
                $dateFrom = $_GET['from'] ?? null;
                $dateTo   = $_GET['to']   ?? null;

                if ($id) {
                    // Facture d'un achat avec détails
                    $s = $db->prepare("
                        SELECT a.*, c.nom, c.contact,
                               v.design, v.prix, (v.prix * a.qte) as total
                        FROM achat a
                        JOIN client c ON a.idcli = c.idcli
                        JOIN voiture v ON a.idvoit = v.idvoit
                        WHERE a.numachat = ?
                    ");
                    $s->execute([$id]);
                    echo json_encode($s->fetch());
                } elseif ($dateFrom && $dateTo) {
                    $s = $db->prepare("
                        SELECT a.*, c.nom, v.design, v.prix, (v.prix * a.qte) as total
                        FROM achat a
                        JOIN client c ON a.idcli = c.idcli
                        JOIN voiture v ON a.idvoit = v.idvoit
                        WHERE a.date BETWEEN ? AND ?
                        ORDER BY a.date DESC
                    ");
                    $s->execute([$dateFrom, $dateTo]);
                    echo json_encode($s->fetchAll());
                } else {
                    $s = $db->query("
                        SELECT a.*, c.nom, v.design, v.prix, (v.prix * a.qte) as total
                        FROM achat a
                        JOIN client c ON a.idcli = c.idcli
                        JOIN voiture v ON a.idvoit = v.idvoit
                        ORDER BY a.date DESC
                    ");
                    echo json_encode($s->fetchAll());
                }
                break;

            case 'POST':
                // Vérif stock
                $sv = $db->prepare("SELECT nombre FROM voiture WHERE idvoit = ?");
                $sv->execute([$body['idvoit']]);
                $voiture = $sv->fetch();
                if (!$voiture || $voiture['nombre'] < $body['qte']) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Stock insuffisant']);
                    return;
                }
                // Insérer achat
                $s = $db->prepare("INSERT INTO achat VALUES (?, ?, ?, ?, ?) RETURNING *");
                $s->execute([$body['numachat'], $body['idcli'], $body['idvoit'], $body['date'], $body['qte']]);
                // Décrémenter stock
                $db->prepare("UPDATE voiture SET nombre = nombre - ? WHERE idvoit = ?")
                   ->execute([$body['qte'], $body['idvoit']]);
                http_response_code(201);
                echo json_encode($s->fetch());
                break;

            case 'PUT':
                $s = $db->prepare("UPDATE achat SET idcli=?, idvoit=?, date=?, qte=? WHERE numachat=? RETURNING *");
                $s->execute([$body['idcli'], $body['idvoit'], $body['date'], $body['qte'], $id]);
                echo json_encode($s->fetch());
                break;

            case 'DELETE':
                // Remettre le stock
                $sa = $db->prepare("SELECT idvoit, qte FROM achat WHERE numachat = ?");
                $sa->execute([$id]);
                $achat = $sa->fetch();
                if ($achat) {
                    $db->prepare("UPDATE voiture SET nombre = nombre + ? WHERE idvoit = ?")
                       ->execute([$achat['qte'], $achat['idvoit']]);
                }
                $db->prepare("DELETE FROM achat WHERE numachat=?")->execute([$id]);
                echo json_encode(['success' => true]);
                break;
        }
    }
}

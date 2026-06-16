<?php
class ClientController {
    public static function handle(string $method, ?string $id, array $body, PDO $db): void {
        switch ($method) {
            case 'GET':
                if ($id) {
                    $s = $db->prepare("SELECT * FROM client WHERE idcli = ?");
                    $s->execute([$id]);
                    echo json_encode($s->fetch());
                } else {
                    $s = $db->query("SELECT * FROM client ORDER BY nom");
                    echo json_encode($s->fetchAll());
                }
                break;
            case 'POST':
                $s = $db->prepare("INSERT INTO client VALUES (?, ?, ?) RETURNING *");
                $s->execute([$body['idcli'], $body['nom'], $body['contact']]);
                http_response_code(201);
                echo json_encode($s->fetch());
                break;
            case 'PUT':
                $s = $db->prepare("UPDATE client SET nom=?, contact=? WHERE idcli=? RETURNING *");
                $s->execute([$body['nom'], $body['contact'], $id]);
                echo json_encode($s->fetch());
                break;
            case 'DELETE':
                $db->beginTransaction();
                try {
                    // 1. Supprimer les lignes de facture liées aux achats du client
                    $db->prepare("DELETE FROM ligne_facture WHERE numachat IN (SELECT numachat FROM achat WHERE idcli = ?)")->execute([$id]);
                    // 2. Supprimer les factures du client
                    $db->prepare("DELETE FROM facture WHERE idcli = ?")->execute([$id]);
                    // 3. Supprimer les achats du client
                    $db->prepare("DELETE FROM achat WHERE idcli = ?")->execute([$id]);
                    // 4. Supprimer le client
                    $db->prepare("DELETE FROM client WHERE idcli = ?")->execute([$id]);
                    $db->commit();
                    echo json_encode(['success' => true]);
                } catch (Exception $e) {
                    $db->rollBack();
                    http_response_code(500);
                    echo json_encode(['error' => $e->getMessage()]);
                }
                break;
        }
    }
}

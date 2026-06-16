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
                $s = $db->prepare("DELETE FROM client WHERE idcli=?");
                $s->execute([$id]);
                echo json_encode(['success' => true]);
                break;
        }
    }
}

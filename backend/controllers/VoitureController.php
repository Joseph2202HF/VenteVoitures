<?php
class VoitureController {
    public static function handle(string $method, ?string $id, array $body, PDO $db): void {
        switch ($method) {
            case 'GET':
                $search = $_GET['q'] ?? null;
                if ($id) {
                    $s = $db->prepare("SELECT * FROM voiture WHERE idvoit = ?");
                    $s->execute([$id]);
                    echo json_encode($s->fetch());
                } elseif ($search) {
                    $s = $db->prepare("SELECT * FROM voiture WHERE idvoit ILIKE ? OR design ILIKE ?");
                    $like = "%$search%";
                    $s->execute([$like, $like]);
                    echo json_encode($s->fetchAll());
                } else {
                    $s = $db->query("SELECT * FROM voiture ORDER BY design");
                    echo json_encode($s->fetchAll());
                }
                break;
            case 'POST':
                $s = $db->prepare("INSERT INTO voiture VALUES (?, ?, ?, ?) RETURNING *");
                $s->execute([$body['idvoit'], $body['design'], $body['prix'], $body['nombre']]);
                http_response_code(201);
                echo json_encode($s->fetch());
                break;
            case 'PUT':
                $s = $db->prepare("UPDATE voiture SET design=?, prix=?, nombre=? WHERE idvoit=? RETURNING *");
                $s->execute([$body['design'], $body['prix'], $body['nombre'], $id]);
                echo json_encode($s->fetch());
                break;
            case 'DELETE':
                $s = $db->prepare("DELETE FROM voiture WHERE idvoit=?");
                $s->execute([$id]);
                echo json_encode(['success' => true]);
                break;
        }
    }
}

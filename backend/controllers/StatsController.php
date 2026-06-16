<?php
class StatsController {
    public static function handle(string $method, ?string $id, array $body, PDO $db): void {
        if ($method !== 'GET') { http_response_code(405); echo json_encode(['error' => 'Method not allowed']); return; }

        switch ($id) {
            case 'recettes':
                // Recette totale des 6 derniers mois
                $s = $db->query("
                    SELECT TO_CHAR(a.date, 'YYYY-MM') as mois,
                           TO_CHAR(a.date, 'Month YYYY') as label,
                           SUM(v.prix * a.qte) as total
                    FROM achat a
                    JOIN voiture v ON a.idvoit = v.idvoit
                    WHERE a.date >= DATE_TRUNC('month', NOW()) - INTERVAL '5 months'
                    GROUP BY TO_CHAR(a.date, 'YYYY-MM'), TO_CHAR(a.date, 'Month YYYY')
                    ORDER BY mois
                ");
                echo json_encode($s->fetchAll());
                break;

            case 'facture':
                // Facture complète d'un client (tous ses achats)
                $idcli = $_GET['idcli'] ?? null;
                if (!$idcli) { http_response_code(400); echo json_encode(['error' => 'idcli requis']); return; }
                $sc = $db->prepare("SELECT * FROM client WHERE idcli = ?");
                $sc->execute([$idcli]);
                $client = $sc->fetch();
                $sa = $db->prepare("
                    SELECT a.numachat, a.date, a.qte, v.design, v.prix, (v.prix * a.qte) as total
                    FROM achat a JOIN voiture v ON a.idvoit = v.idvoit
                    WHERE a.idcli = ?
                    ORDER BY a.date DESC
                ");
                $sa->execute([$idcli]);
                $achats = $sa->fetchAll();
                $grandTotal = array_sum(array_column($achats, 'total'));
                echo json_encode(['client' => $client, 'achats' => $achats, 'grandTotal' => $grandTotal]);
                break;

            default:
                http_response_code(404);
                echo json_encode(['error' => 'Stat not found']);
        }
    }
}
